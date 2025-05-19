-- Add profile_id column to cases table
ALTER TABLE public.cases 
ADD COLUMN IF NOT EXISTS profile_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update RLS policies for cases
DROP POLICY IF EXISTS "Users can view their assigned cases" ON public.cases;
CREATE POLICY "Users can view their own cases"
    ON public.cases
    FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM public.profiles
            WHERE clerk_id = auth.jwt()->>'sub'
        )
    );

CREATE POLICY "Users can insert their own cases"
    ON public.cases
    FOR INSERT
    WITH CHECK (
        profile_id IN (
            SELECT id FROM public.profiles
            WHERE clerk_id = auth.jwt()->>'sub'
        )
    );

CREATE POLICY "Users can update their own cases"
    ON public.cases
    FOR UPDATE
    USING (
        profile_id IN (
            SELECT id FROM public.profiles
            WHERE clerk_id = auth.jwt()->>'sub'
        )
    );

CREATE POLICY "Users can delete their own cases"
    ON public.cases
    FOR DELETE
    USING (
        profile_id IN (
            SELECT id FROM public.profiles
            WHERE clerk_id = auth.jwt()->>'sub'
        )
    );

-- Create index for profile_id
CREATE INDEX IF NOT EXISTS idx_cases_profile_id ON public.cases(profile_id); 