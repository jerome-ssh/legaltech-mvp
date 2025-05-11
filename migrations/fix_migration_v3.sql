-- Step 1: Drop existing tables if they exist
DROP TABLE IF EXISTS document_permissions CASCADE;
DROP TABLE IF EXISTS documents CASCADE;

-- Step 2: Create tables without RLS
CREATE TABLE documents (
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

CREATE TABLE document_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_level TEXT CHECK (permission_level IN ('read', 'write', 'admin')),
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, user_id)
);

-- Step 3: Create basic indexes
CREATE INDEX idx_documents_case_id ON documents(case_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_document_permissions_document_id ON document_permissions(document_id);
CREATE INDEX idx_document_permissions_user_id ON document_permissions(user_id);

-- Step 4: Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple policies
-- Documents policies
CREATE POLICY "Allow users to view their own documents"
    ON documents FOR SELECT
    USING (uploaded_by = auth.uid());

CREATE POLICY "Allow users to create documents"
    ON documents FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to update their own documents"
    ON documents FOR UPDATE
    USING (uploaded_by = auth.uid());

-- Document permissions policies
CREATE POLICY "Allow users to view their own permissions"
    ON document_permissions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Allow document owners to manage permissions"
    ON document_permissions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = document_permissions.document_id
            AND documents.uploaded_by = auth.uid()
        )
    );

-- Step 6: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 7: Add triggers
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_permissions_updated_at
    BEFORE UPDATE ON document_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 