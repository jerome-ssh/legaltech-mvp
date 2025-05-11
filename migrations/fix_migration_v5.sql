-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a function to get the current user's UUID
CREATE OR REPLACE FUNCTION get_current_user_uuid()
RETURNS UUID AS $$
BEGIN
    -- This function will be called by RLS policies
    -- It should return the UUID of the currently authenticated user
    -- For now, we'll use a placeholder that will be replaced by the actual user ID
    RETURN current_setting('app.current_user_id', true)::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
DROP POLICY IF EXISTS "Users can view document permissions they have" ON document_permissions;
DROP POLICY IF EXISTS "Users can create document permissions" ON document_permissions;
DROP POLICY IF EXISTS "Users can update document permissions they granted" ON document_permissions;
DROP POLICY IF EXISTS "Users can delete document permissions they granted" ON document_permissions;

-- Create new RLS policies using the get_current_user_uuid function
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

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Create a function to set the current user ID
CREATE OR REPLACE FUNCTION set_current_user_id(user_id UUID)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 