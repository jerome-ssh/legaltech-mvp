-- Create user_activities table
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    time_saved INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own activities"
    ON public.user_activities
    FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM public.profiles
            WHERE clerk_id = auth.jwt()->>'sub'
        )
    );

CREATE POLICY "Users can insert their own activities"
    ON public.user_activities
    FOR INSERT
    WITH CHECK (
        profile_id IN (
            SELECT id FROM public.profiles
            WHERE clerk_id = auth.jwt()->>'sub'
        )
    );

CREATE POLICY "Users can update their own activities"
    ON public.user_activities
    FOR UPDATE
    USING (
        profile_id IN (
            SELECT id FROM public.profiles
            WHERE clerk_id = auth.jwt()->>'sub'
        )
    );

CREATE POLICY "Users can delete their own activities"
    ON public.user_activities
    FOR DELETE
    USING (
        profile_id IN (
            SELECT id FROM public.profiles
            WHERE clerk_id = auth.jwt()->>'sub'
        )
    );

-- Grant permissions
GRANT ALL ON public.user_activities TO authenticated;
GRANT ALL ON public.user_activities TO service_role; 