-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS document_permissions CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS document_versions CASCADE;
DROP TABLE IF EXISTS document_comments CASCADE;
DROP TABLE IF EXISTS document_tags CASCADE;
DROP TABLE IF EXISTS document_tag_relationships CASCADE;
DROP TABLE IF EXISTS document_categories CASCADE;
DROP TABLE IF EXISTS document_workflows CASCADE;
DROP TABLE IF EXISTS document_audit_logs CASCADE;
DROP TABLE IF EXISTS case_types CASCADE;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'review', 'approved', 'archived')),
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create document_permissions table
CREATE TABLE document_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    permission_level TEXT NOT NULL CHECK (permission_level IN ('read', 'write', 'admin')),
    granted_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create document_versions table
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create document_comments table
CREATE TABLE document_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create document_tags table
CREATE TABLE document_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create document_tag_relationships table
CREATE TABLE document_tag_relationships (
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES document_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, tag_id)
);

-- Create document_categories table
CREATE TABLE document_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create document_workflows table
CREATE TABLE document_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    assigned_to UUID,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create document_audit_logs table
CREATE TABLE document_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create case_types table
CREATE TABLE case_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add triggers for updated_at
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_permissions_updated_at
    BEFORE UPDATE ON document_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_comments_updated_at
    BEFORE UPDATE ON document_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_workflows_updated_at
    BEFORE UPDATE ON document_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_document_permissions_user_id ON document_permissions(user_id);
CREATE INDEX idx_document_permissions_document_id ON document_permissions(document_id);
CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX idx_document_comments_document_id ON document_comments(document_id);
CREATE INDEX idx_document_workflows_document_id ON document_workflows(document_id);
CREATE INDEX idx_document_audit_logs_document_id ON document_audit_logs(document_id);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own documents"
    ON documents FOR SELECT
    USING (uploaded_by = auth.uid());

CREATE POLICY "Users can create their own documents"
    ON documents FOR INSERT
    WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update their own documents"
    ON documents FOR UPDATE
    USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own documents"
    ON documents FOR DELETE
    USING (uploaded_by = auth.uid());

CREATE POLICY "Users can view document permissions they have"
    ON document_permissions FOR SELECT
    USING (user_id = auth.uid() OR granted_by = auth.uid());

CREATE POLICY "Users can create document permissions"
    ON document_permissions FOR INSERT
    WITH CHECK (granted_by = auth.uid());

CREATE POLICY "Users can update document permissions they granted"
    ON document_permissions FOR UPDATE
    USING (granted_by = auth.uid());

CREATE POLICY "Users can delete document permissions they granted"
    ON document_permissions FOR DELETE
    USING (granted_by = auth.uid());

-- Insert default case types
INSERT INTO case_types (name, description) VALUES
    ('Litigation', 'Legal disputes and court cases'),
    ('Corporate', 'Business and corporate matters'),
    ('Real Estate', 'Property and real estate transactions'),
    ('Family Law', 'Family and domestic matters'),
    ('Intellectual Property', 'IP rights and patents'),
    ('Employment', 'Workplace and employment issues'),
    ('Tax', 'Taxation and financial matters'),
    ('Immigration', 'Immigration and citizenship'),
    ('Criminal', 'Criminal defense and prosecution'),
    ('Estate Planning', 'Wills, trusts, and estates')
ON CONFLICT (name) DO NOTHING; 