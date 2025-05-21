-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own cases" ON cases;

-- Create new policies with correct column names
CREATE POLICY "Users can view their own cases"
    ON cases FOR SELECT
    USING (auth.uid() = client_id OR auth.uid() = profile_id);

-- Add RLS to cases table if not already enabled
ALTER TABLE cases ENABLE ROW LEVEL SECURITY; 