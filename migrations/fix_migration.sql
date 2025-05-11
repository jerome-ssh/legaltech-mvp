-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create documents table first (since it's referenced by other tables)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    case_id UUID REFERENCES cases(id),
    file_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    uploaded_by UUID REFERENCES auth.users(id),
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create document_permissions table
CREATE TABLE IF NOT EXISTS document_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_level TEXT CHECK (permission_level IN ('read', 'write', 'admin')),
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, user_id)
);

-- Enable RLS
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for documents
CREATE POLICY "Users can view documents they have access to"
    ON documents FOR SELECT
    USING (
        uploaded_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM document_permissions
            WHERE document_id = documents.id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create documents"
    ON documents FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update documents they have write access to"
    ON documents FOR UPDATE
    USING (
        uploaded_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM document_permissions
            WHERE document_id = documents.id
            AND user_id = auth.uid()
            AND permission_level IN ('write', 'admin')
        )
    );

-- Create RLS policies for document_permissions
CREATE POLICY "Users can view their own permissions"
    ON document_permissions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Document owners can manage permissions"
    ON document_permissions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM documents
            WHERE id = document_permissions.document_id
            AND uploaded_by = auth.uid()
        )
    );

-- Add updated_at triggers
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_permissions_updated_at
    BEFORE UPDATE ON document_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

CREATE INDEX IF NOT EXISTS idx_document_permissions_document_id ON document_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_user_id ON document_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_granted_at ON document_permissions(granted_at);

-- Create function to get document permissions
CREATE OR REPLACE FUNCTION get_document_permissions(p_document_id UUID)
RETURNS TABLE (
    user_id UUID,
    permission_level TEXT,
    granted_by UUID,
    granted_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dp.user_id,
        dp.permission_level,
        dp.granted_by,
        dp.granted_at
    FROM document_permissions dp
    WHERE dp.document_id = p_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default case types if not exists
INSERT INTO case_types (name, description)
VALUES 
    ('Criminal', 'Criminal law cases'),
    ('Civil', 'Civil law cases'),
    ('Family', 'Family law cases'),
    ('Corporate', 'Corporate law cases'),
    ('Real Estate', 'Real estate law cases'),
    ('Intellectual Property', 'IP law cases')
ON CONFLICT (name) DO NOTHING; 