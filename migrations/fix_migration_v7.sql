-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies first
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable update for document owners" ON documents;
DROP POLICY IF EXISTS "Enable delete for document owners" ON documents;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON document_permissions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON document_permissions;
DROP POLICY IF EXISTS "Enable update for permission granters" ON document_permissions;
DROP POLICY IF EXISTS "Enable delete for permission granters" ON document_permissions;
DROP POLICY IF EXISTS "documents_select_policy" ON documents;
DROP POLICY IF EXISTS "documents_insert_policy" ON documents;
DROP POLICY IF EXISTS "documents_update_policy" ON documents;
DROP POLICY IF EXISTS "documents_delete_policy" ON documents;
DROP POLICY IF EXISTS "document_permissions_select_policy" ON document_permissions;
DROP POLICY IF EXISTS "document_permissions_insert_policy" ON document_permissions;
DROP POLICY IF EXISTS "document_permissions_update_policy" ON document_permissions;
DROP POLICY IF EXISTS "document_permissions_delete_policy" ON document_permissions;
DROP POLICY IF EXISTS "documents_policy" ON documents;
DROP POLICY IF EXISTS "document_permissions_policy" ON document_permissions;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Allow all operations on profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all operations on documents" ON documents;
DROP POLICY IF EXISTS "Allow all operations on document_permissions" ON document_permissions;
DROP POLICY IF EXISTS "profiles_policy" ON profiles;
DROP POLICY IF EXISTS "documents_policy" ON documents;
DROP POLICY IF EXISTS "document_permissions_policy" ON document_permissions;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_law_firms_updated_at ON law_firms;
DROP TRIGGER IF EXISTS update_practice_areas_updated_at ON practice_areas;
DROP TRIGGER IF EXISTS update_case_participants_updated_at ON case_participants;
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_cases_updated_at ON cases;
DROP TRIGGER IF EXISTS update_billing_updated_at ON billing;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_client_feedback_updated_at ON client_feedback;
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
DROP TRIGGER IF EXISTS update_document_permissions_updated_at ON document_permissions;
DROP TRIGGER IF EXISTS update_document_comments_updated_at ON document_comments;
DROP TRIGGER IF EXISTS update_document_workflows_updated_at ON document_workflows;

-- Drop existing functions with CASCADE
DROP FUNCTION IF EXISTS has_document_access(UUID) CASCADE;
DROP FUNCTION IF EXISTS clerk_to_supabase_user_id(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_current_user_uuid() CASCADE;
DROP FUNCTION IF EXISTS set_current_user_id(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS is_authenticated() CASCADE;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS document_permissions;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS profiles;

-- Create a function to map Clerk user IDs to Supabase user IDs
CREATE OR REPLACE FUNCTION clerk_to_supabase_user_id(clerk_id TEXT)
RETURNS UUID AS $$
BEGIN
    -- Convert Clerk ID to a deterministic UUID
    RETURN uuid_generate_v5(uuid_ns_url(), clerk_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    full_name TEXT,
    email TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'attorney' CHECK (role IN ('attorney', 'admin')),
    phone_number TEXT,
    address TEXT,
    firm_name TEXT,
    specialization TEXT,
    bar_number TEXT,
    years_of_practice TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create document_permissions table
CREATE TABLE document_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    permission_level TEXT CHECK (permission_level IN ('read', 'write', 'admin')),
    granted_by UUID NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, user_id)
);

-- Create indexes
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_document_permissions_document_id ON document_permissions(document_id);
CREATE INDEX idx_document_permissions_user_id ON document_permissions(user_id);
CREATE INDEX idx_document_permissions_granted_by ON document_permissions(granted_by);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_permissions_updated_at
    BEFORE UPDATE ON document_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant additional permissions for table structure
GRANT SELECT ON information_schema.columns TO authenticated;
GRANT SELECT ON information_schema.tables TO authenticated;
GRANT SELECT ON information_schema.views TO authenticated;
GRANT SELECT ON information_schema.routines TO authenticated;
GRANT SELECT ON information_schema.triggers TO authenticated;

-- Temporarily disable RLS for testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_permissions DISABLE ROW LEVEL SECURITY;

-- Create a function to check if a user has access to a document
CREATE OR REPLACE FUNCTION has_document_access(doc_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM documents
        WHERE id = doc_id AND uploaded_by = clerk_to_supabase_user_id(current_user)
        UNION
        SELECT 1 FROM document_permissions
        WHERE document_id = doc_id AND user_id = clerk_to_supabase_user_id(current_user)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 