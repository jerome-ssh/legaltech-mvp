-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies and functions
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
DROP POLICY IF EXISTS "Users can view document permissions they have" ON document_permissions;
DROP POLICY IF EXISTS "Users can create document permissions" ON document_permissions;
DROP POLICY IF EXISTS "Users can update document permissions they granted" ON document_permissions;
DROP POLICY IF EXISTS "Users can delete document permissions they granted" ON document_permissions;
DROP FUNCTION IF EXISTS get_current_user_uuid();
DROP FUNCTION IF EXISTS set_current_user_id(UUID);

-- Create a function to get the current user's UUID
CREATE OR REPLACE FUNCTION get_current_user_uuid()
RETURNS UUID AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Try to get the user ID from the session
    BEGIN
        user_id := current_setting('app.current_user_id', true)::uuid;
    EXCEPTION WHEN OTHERS THEN
        -- If not set, return a default UUID (this should never happen in production)
        user_id := '00000000-0000-0000-0000-000000000000'::uuid;
    END;
    RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to set the current user ID
CREATE OR REPLACE FUNCTION set_current_user_id(user_id UUID)
RETURNS void AS $$
BEGIN
    -- Set the user ID in the session
    PERFORM set_config('app.current_user_id', user_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Create new RLS policies
CREATE POLICY "Users can view their own documents"
    ON documents FOR SELECT
    USING (uploaded_by = get_current_user_uuid());

CREATE POLICY "Users can create their own documents"
    ON documents FOR INSERT
    WITH CHECK (uploaded_by = get_current_user_uuid());

CREATE POLICY "Users can update their own documents"
    ON documents FOR UPDATE
    USING (uploaded_by = get_current_user_uuid());

CREATE POLICY "Users can delete their own documents"
    ON documents FOR DELETE
    USING (uploaded_by = get_current_user_uuid());

CREATE POLICY "Users can view document permissions they have"
    ON document_permissions FOR SELECT
    USING (user_id = get_current_user_uuid() OR granted_by = get_current_user_uuid());

CREATE POLICY "Users can create document permissions"
    ON document_permissions FOR INSERT
    WITH CHECK (granted_by = get_current_user_uuid());

CREATE POLICY "Users can update document permissions they granted"
    ON document_permissions FOR UPDATE
    USING (granted_by = get_current_user_uuid());

CREATE POLICY "Users can delete document permissions they granted"
    ON document_permissions FOR DELETE
    USING (granted_by = get_current_user_uuid());

-- Grant additional permissions for table structure
GRANT SELECT ON information_schema.columns TO authenticated;
GRANT SELECT ON information_schema.tables TO authenticated;

-- Create a function to check if a user has access to a document
CREATE OR REPLACE FUNCTION has_document_access(doc_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM documents
        WHERE id = doc_id AND uploaded_by = get_current_user_uuid()
        UNION
        SELECT 1 FROM document_permissions
        WHERE document_id = doc_id AND user_id = get_current_user_uuid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 