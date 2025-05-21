-- Create connections table
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    connection_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger for updated_at
CREATE TRIGGER set_connections_updated_at
    BEFORE UPDATE ON public.connections
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own connections"
    ON public.connections
    FOR SELECT
    USING (profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own connections"
    ON public.connections
    FOR INSERT
    WITH CHECK (profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own connections"
    ON public.connections
    FOR UPDATE
    USING (profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own connections"
    ON public.connections
    FOR DELETE
    USING (profile_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
    ));

-- Grant permissions
GRANT ALL ON public.connections TO authenticated;
GRANT ALL ON public.connections TO service_role;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_connections_profile_id ON public.connections(profile_id);
CREATE INDEX IF NOT EXISTS idx_connections_created_at ON public.connections(created_at); 