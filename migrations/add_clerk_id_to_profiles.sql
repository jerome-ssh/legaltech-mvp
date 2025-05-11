-- Add clerk_id column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clerk_id TEXT;

-- Create an index on clerk_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_id ON profiles(clerk_id);

-- Update RLS policies to allow access based on clerk_id
CREATE POLICY "Users can view profiles by clerk_id"
    ON profiles FOR SELECT
    USING (clerk_id = auth.jwt()->>'sub');

CREATE POLICY "Users can update profiles by clerk_id"
    ON profiles FOR UPDATE
    USING (clerk_id = auth.jwt()->>'sub'); 