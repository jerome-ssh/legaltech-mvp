-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.client_feedback CASCADE;
DROP TABLE IF EXISTS public.user_metrics CASCADE;

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create client_feedback table
CREATE TABLE IF NOT EXISTS public.client_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_metrics table
CREATE TABLE IF NOT EXISTS public.user_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    profile_completion INTEGER NOT NULL DEFAULT 0,
    productivity_score INTEGER NOT NULL DEFAULT 0,
    client_feedback INTEGER NOT NULL DEFAULT 0,
    time_saved INTEGER NOT NULL DEFAULT 0,
    ai_interactions INTEGER NOT NULL DEFAULT 0,
    networking_score INTEGER NOT NULL DEFAULT 0,
    compliance_score INTEGER NOT NULL DEFAULT 0,
    billing_efficiency INTEGER NOT NULL DEFAULT 0,
    workflow_efficiency INTEGER NOT NULL DEFAULT 0,
    learning_progress INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id)
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Users can view their own tasks"
    ON public.tasks
    FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM public.profiles
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own tasks"
    ON public.tasks
    FOR INSERT
    WITH CHECK (
        profile_id IN (
            SELECT id FROM public.profiles
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own tasks"
    ON public.tasks
    FOR UPDATE
    USING (
        profile_id IN (
            SELECT id FROM public.profiles
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own tasks"
    ON public.tasks
    FOR DELETE
    USING (
        profile_id IN (
            SELECT id FROM public.profiles
            WHERE user_id = auth.uid()
        )
    );

-- Create policies for client_feedback
CREATE POLICY "Users can view their own feedback"
    ON public.client_feedback
    FOR SELECT
    USING (profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own feedback"
    ON public.client_feedback
    FOR INSERT
    WITH CHECK (profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own feedback"
    ON public.client_feedback
    FOR UPDATE
    USING (profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own feedback"
    ON public.client_feedback
    FOR DELETE
    USING (profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ));

-- Create policies for user_metrics
CREATE POLICY "Users can view their own metrics"
    ON public.user_metrics
    FOR SELECT
    USING (profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own metrics"
    ON public.user_metrics
    FOR UPDATE
    USING (profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own metrics"
    ON public.user_metrics
    FOR INSERT
    WITH CHECK (profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own metrics"
    ON public.user_metrics
    FOR DELETE
    USING (profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ));

-- Grant permissions
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
GRANT ALL ON public.client_feedback TO authenticated;
GRANT ALL ON public.client_feedback TO service_role;
GRANT ALL ON public.user_metrics TO authenticated;
GRANT ALL ON public.user_metrics TO service_role; 

-- Create trigger for updated_at
CREATE TRIGGER set_client_feedback_updated_at
    BEFORE UPDATE ON public.client_feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_user_metrics_updated_at
    BEFORE UPDATE ON public.user_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_feedback_profile_id ON public.client_feedback(profile_id);
CREATE INDEX IF NOT EXISTS idx_client_feedback_rating ON public.client_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_client_feedback_created_at ON public.client_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_user_metrics_profile_id ON public.user_metrics(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_metrics_created_at ON public.user_metrics(created_at); 