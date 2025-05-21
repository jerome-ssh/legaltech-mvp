-- Create AI interactions table
CREATE TABLE IF NOT EXISTS public.ai_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL,
    input_text TEXT,
    output_text TEXT,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own AI interactions"
    ON public.ai_interactions FOR SELECT
    USING (profile_id IN (
        SELECT id FROM public.profiles
        WHERE user_id = (auth.jwt()->>'sub')::UUID
    ));

CREATE POLICY "Users can insert their own AI interactions"
    ON public.ai_interactions FOR INSERT
    WITH CHECK (profile_id IN (
        SELECT id FROM public.profiles
        WHERE user_id = (auth.jwt()->>'sub')::UUID
    ));

CREATE POLICY "Users can update their own AI interactions"
    ON public.ai_interactions FOR UPDATE
    USING (profile_id IN (
        SELECT id FROM public.profiles
        WHERE user_id = (auth.jwt()->>'sub')::UUID
    ));

CREATE POLICY "Users can delete their own AI interactions"
    ON public.ai_interactions FOR DELETE
    USING (profile_id IN (
        SELECT id FROM public.profiles
        WHERE user_id = (auth.jwt()->>'sub')::UUID
    ));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_interactions_profile_id ON public.ai_interactions(profile_id); 