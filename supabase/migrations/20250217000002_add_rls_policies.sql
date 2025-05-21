-- Enable RLS
ALTER TABLE public.user_metrics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own metrics" ON public.user_metrics;
DROP POLICY IF EXISTS "Users can insert their own metrics" ON public.user_metrics;
DROP POLICY IF EXISTS "Users can update their own metrics" ON public.user_metrics;
DROP POLICY IF EXISTS "Users can delete their own metrics" ON public.user_metrics;

-- Create new policies
CREATE POLICY "Users can view their own metrics"
    ON public.user_metrics FOR SELECT
    USING (EXISTS (SELECT 1
                   FROM public.profiles p
                   WHERE p.id = public.user_metrics.profile_id AND p.user_id = (auth.jwt()->>'sub')::UUID));

CREATE POLICY "Users can insert their own metrics"
    ON public.user_metrics FOR INSERT
    WITH CHECK (EXISTS (SELECT 1
                        FROM public.profiles p
                        WHERE p.id = public.user_metrics.profile_id AND p.user_id = (auth.jwt()->>'sub')::UUID));

CREATE POLICY "Users can update their own metrics"
    ON public.user_metrics FOR UPDATE
    USING (EXISTS (SELECT 1
                   FROM public.profiles p
                   WHERE p.id = public.user_metrics.profile_id AND p.user_id = (auth.jwt()->>'sub')::UUID));

CREATE POLICY "Users can delete their own metrics"
    ON public.user_metrics FOR DELETE
    USING (EXISTS (SELECT 1
                   FROM public.profiles p
                   WHERE p.id = public.user_metrics.profile_id AND p.user_id = (auth.jwt()->>'sub')::UUID)); 