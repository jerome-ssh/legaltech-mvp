-- Drop existing policies
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON profiles;

-- Create new policies
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (clerk_id = auth.uid());

CREATE POLICY "Users can create their own profile"
    ON profiles FOR INSERT
    WITH CHECK (clerk_id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (clerk_id = auth.uid());

-- Create index for clerk_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_id ON profiles(clerk_id); 