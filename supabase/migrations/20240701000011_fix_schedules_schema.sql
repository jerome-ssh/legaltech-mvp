-- First, disable RLS temporarily to make changes easier
ALTER TABLE public.schedules DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies for schedules table
DROP POLICY IF EXISTS "Users can view their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can insert their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can update their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can delete their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can view schedules related to their profile" ON public.schedules;
DROP POLICY IF EXISTS "Users can insert schedules with their profile" ON public.schedules;
DROP POLICY IF EXISTS "Users can update their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can delete their own schedules" ON public.schedules;

-- Drop the user_id column if it exists
ALTER TABLE public.schedules 
DROP COLUMN IF EXISTS user_id;

-- Ensure profile_id is NOT NULL
ALTER TABLE public.schedules 
ALTER COLUMN profile_id SET NOT NULL;

-- Add any missing columns that might be needed
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'meeting',
ADD COLUMN IF NOT EXISTS status text DEFAULT 'scheduled',
ADD COLUMN IF NOT EXISTS participants text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_pattern text;

-- Re-enable RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Create new RLS policies using profile_id
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