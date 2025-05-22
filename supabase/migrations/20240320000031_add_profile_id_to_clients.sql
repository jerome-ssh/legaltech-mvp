-- Add profile_id column to clients table
ALTER TABLE clients ADD COLUMN profile_id UUID REFERENCES profiles(id);

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view clients" ON clients;
DROP POLICY IF EXISTS "Users can insert clients" ON clients;
DROP POLICY IF EXISTS "Users can update clients" ON clients;

-- Create new policies with profile_id
CREATE POLICY "Users can view their own clients"
    ON clients FOR SELECT
    USING (profile_id IN (
        SELECT id FROM profiles WHERE clerk_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own clients"
    ON clients FOR INSERT
    WITH CHECK (profile_id IN (
        SELECT id FROM profiles WHERE clerk_id = auth.uid()
    ));

CREATE POLICY "Users can update their own clients"
    ON clients FOR UPDATE
    USING (profile_id IN (
        SELECT id FROM profiles WHERE clerk_id = auth.uid()
    ));

-- Create index for profile_id
CREATE INDEX IF NOT EXISTS idx_clients_profile_id ON clients(profile_id); 