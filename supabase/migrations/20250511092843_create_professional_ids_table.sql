-- Create professional_ids table
CREATE TABLE IF NOT EXISTS public.professional_ids (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    country TEXT NOT NULL,
    state TEXT,
    professional_id TEXT,
    year_issued INTEGER,
    no_id BOOLEAN DEFAULT false,
    document_url TEXT,
    document_name TEXT,
    issuing_authority TEXT,
    issue_date DATE,
    expiration_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'expired', 'revoked')),
    verification_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_professional_ids_profile_id ON public.professional_ids(profile_id);
CREATE INDEX IF NOT EXISTS idx_professional_ids_country ON public.professional_ids(country);
CREATE INDEX IF NOT EXISTS idx_professional_ids_status ON public.professional_ids(status);

-- Enable RLS
ALTER TABLE public.professional_ids ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own professional IDs"
    ON public.professional_ids FOR SELECT
    USING (profile_id IN (
        SELECT id FROM public.profiles
        WHERE user_id = (auth.jwt()->>'sub')::UUID
    ));

CREATE POLICY "Users can insert their own professional IDs"
    ON public.professional_ids FOR INSERT
    WITH CHECK (profile_id IN (
        SELECT id FROM public.profiles
        WHERE user_id = (auth.jwt()->>'sub')::UUID
    ));

CREATE POLICY "Users can update their own professional IDs"
    ON public.professional_ids FOR UPDATE
    USING (profile_id IN (
        SELECT id FROM public.profiles
        WHERE user_id = (auth.jwt()->>'sub')::UUID
    ));

CREATE POLICY "Users can delete their own professional IDs"
    ON public.professional_ids FOR DELETE
    USING (profile_id IN (
        SELECT id FROM public.profiles
        WHERE user_id = (auth.jwt()->>'sub')::UUID
    ));

-- Create trigger for updated_at
CREATE TRIGGER set_professional_ids_updated_at
    BEFORE UPDATE ON public.professional_ids
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 