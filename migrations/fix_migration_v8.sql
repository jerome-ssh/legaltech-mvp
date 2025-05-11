-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
DROP POLICY IF EXISTS "Users can view document permissions they have" ON document_permissions;
DROP POLICY IF EXISTS "Users can create document permissions" ON document_permissions;
DROP POLICY IF EXISTS "Users can update document permissions they granted" ON document_permissions;
DROP POLICY IF EXISTS "Users can delete document permissions they granted" ON document_permissions;

-- Create new RLS policies
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

-- Add policy to allow service role to bypass RLS
CREATE POLICY "Service role can bypass RLS"
    ON document_permissions FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated; 