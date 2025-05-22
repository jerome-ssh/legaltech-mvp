-- Drop the existing delete policy
DROP POLICY IF EXISTS "Users can delete their own schedules" ON public.schedules;

-- Create a new delete policy with proper profile_id check
CREATE POLICY "Users can delete their own schedules"
    ON public.schedules
    FOR DELETE
    USING (
        profile_id IN (
            SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
        )
    ); 