-- Rename user_id to profile_id in user_metrics table
ALTER TABLE user_metrics RENAME COLUMN user_id TO profile_id;

-- Update RLS policies to use profile_id
DROP POLICY IF EXISTS "Users can view their own metrics" ON user_metrics;
DROP POLICY IF EXISTS "Users can update their own metrics" ON user_metrics;

CREATE POLICY "Users can view their own metrics"
    ON user_metrics
    FOR SELECT
    USING (auth.uid()::text = profile_id);

CREATE POLICY "Users can update their own metrics"
    ON user_metrics
    FOR UPDATE
    USING (auth.uid()::text = profile_id); 