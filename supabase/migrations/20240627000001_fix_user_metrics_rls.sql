-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own metrics" ON user_metrics;
DROP POLICY IF EXISTS "Users can update their own metrics" ON user_metrics;
DROP POLICY IF EXISTS "Users can insert their own metrics" ON user_metrics;
DROP POLICY IF EXISTS "Users can delete their own metrics" ON user_metrics;
DROP POLICY IF EXISTS "System can insert metrics" ON user_metrics;
DROP POLICY IF EXISTS "Allow all operations for testing" ON user_metrics;

-- Create new policies that work with Clerk authentication
CREATE POLICY "Users can view their own metrics"
    ON user_metrics
    FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own metrics"
    ON user_metrics
    FOR UPDATE
    USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own metrics"
    ON user_metrics
    FOR INSERT
    WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own metrics"
    ON user_metrics
    FOR DELETE
    USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE user_id = auth.uid()
        )
    ); 