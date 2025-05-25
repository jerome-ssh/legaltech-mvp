-- Migration: Add client feedback policies
-- Description: This migration adds RLS policies for the client_feedback table.

-- Enable RLS for client_feedback table
ALTER TABLE public.client_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for client_feedback
CREATE POLICY "Users can view their own client feedback"
    ON public.client_feedback
    FOR SELECT
    USING (profile_id IN (
        SELECT id FROM public.profiles
        WHERE clerk_id = auth.uid()::text
    ));

CREATE POLICY "Users can insert their own client feedback"
    ON public.client_feedback
    FOR INSERT
    WITH CHECK (profile_id IN (
        SELECT id FROM public.profiles
        WHERE clerk_id = auth.uid()::text
    ));

CREATE POLICY "Users can update their own client feedback"
    ON public.client_feedback
    FOR UPDATE
    USING (profile_id IN (
        SELECT id FROM public.profiles
        WHERE clerk_id = auth.uid()::text
    ));

-- Create service role bypass policy
CREATE POLICY "Service role can bypass RLS on client_feedback"
    ON public.client_feedback
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Grant necessary permissions
GRANT ALL ON public.client_feedback TO authenticated; 