-- Drop existing policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can do all profile actions" ON profiles;

-- Create new policies for profiles that work with Clerk authentication
CREATE POLICY "Users can view their own profile"
    ON profiles
    FOR SELECT
    USING (clerk_id = auth.jwt()->>'sub');

CREATE POLICY "Users can update their own profile"
    ON profiles
    FOR UPDATE
    USING (clerk_id = auth.jwt()->>'sub')
    WITH CHECK (clerk_id = auth.jwt()->>'sub');

CREATE POLICY "Users can insert their own profile"
    ON profiles
    FOR INSERT
    WITH CHECK (clerk_id = auth.jwt()->>'sub');

-- Add service role bypass policy
CREATE POLICY "Service role can do all profile actions"
    ON profiles
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Drop existing policies for user_metrics
DROP POLICY IF EXISTS "Users can view their own metrics" ON user_metrics;
DROP POLICY IF EXISTS "Users can update their own metrics" ON user_metrics;
DROP POLICY IF EXISTS "Users can insert their own metrics" ON user_metrics;
DROP POLICY IF EXISTS "Users can delete their own metrics" ON user_metrics;

-- Create new policies for user_metrics that work with Clerk authentication
CREATE POLICY "Users can view their own metrics"
    ON user_metrics
    FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = auth.jwt()->>'sub'
        )
    );

CREATE POLICY "Users can update their own metrics"
    ON user_metrics
    FOR UPDATE
    USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = auth.jwt()->>'sub'
        )
    );

CREATE POLICY "Users can insert their own metrics"
    ON user_metrics
    FOR INSERT
    WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = auth.jwt()->>'sub'
        )
    );

CREATE POLICY "Users can delete their own metrics"
    ON user_metrics
    FOR DELETE
    USING (
        profile_id IN (
            SELECT id FROM profiles 
            WHERE clerk_id = auth.jwt()->>'sub'
        )
    ); 