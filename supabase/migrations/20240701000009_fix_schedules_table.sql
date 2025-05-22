-- Add profile_id column to schedules table
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Create index for profile_id
CREATE INDEX IF NOT EXISTS idx_schedules_profile_id ON schedules(profile_id);

-- Update RLS policies for schedules
CREATE POLICY "Users can view schedules related to their profile"
    ON public.schedules
    FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
        )
    );

CREATE POLICY "Users can insert schedules with their profile"
    ON public.schedules
    FOR INSERT
    WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
        )
    );

CREATE POLICY "Users can update their own schedules"
    ON public.schedules
    FOR UPDATE
    USING (
        profile_id IN (
            SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
        )
    );

CREATE POLICY "Users can delete their own schedules"
    ON public.schedules
    FOR DELETE
    USING (
        profile_id IN (
            SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
        )
    ); 