-- First check if the column exists and handle both cases
DO $$ 
BEGIN
    -- Check if user_id column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_metrics' 
        AND column_name = 'user_id'
    ) THEN
        -- If user_id exists, rename it to profile_id
        ALTER TABLE user_metrics RENAME COLUMN user_id TO profile_id;
    END IF;
END $$;

-- Update RLS policies to use profile_id
DROP POLICY IF EXISTS "Users can view their own metrics" ON user_metrics;
DROP POLICY IF EXISTS "Users can update their own metrics" ON user_metrics;
DROP POLICY IF EXISTS "Users can insert their own metrics" ON user_metrics;
DROP POLICY IF EXISTS "Users can delete their own metrics" ON user_metrics;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view their own metrics"
    ON user_metrics
    FOR SELECT
    USING (auth.uid()::uuid = profile_id);

CREATE POLICY "Users can update their own metrics"
    ON user_metrics
    FOR UPDATE
    USING (auth.uid()::uuid = profile_id);

CREATE POLICY "Users can insert their own metrics"
    ON user_metrics
    FOR INSERT
    WITH CHECK (auth.uid()::uuid = profile_id);

CREATE POLICY "Users can delete their own metrics"
    ON user_metrics
    FOR DELETE
    USING (auth.uid()::uuid = profile_id); 