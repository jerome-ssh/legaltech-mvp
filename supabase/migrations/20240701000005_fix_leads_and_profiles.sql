-- Add profile_id to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Create index for profile_id in leads
CREATE INDEX IF NOT EXISTS idx_leads_profile_id ON leads(profile_id);

-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'lawyer', 'client'));

-- Update RLS policies for leads
CREATE POLICY "Users can view leads related to their profile"
    ON public.leads
    FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
        )
    );

CREATE POLICY "Users can insert leads with their profile"
    ON public.leads
    FOR INSERT
    WITH CHECK (
        profile_id IN (
            SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
        )
    );

CREATE POLICY "Users can update their own leads"
    ON public.leads
    FOR UPDATE
    USING (
        profile_id IN (
            SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
        )
    );

CREATE POLICY "Users can delete their own leads"
    ON public.leads
    FOR DELETE
    USING (
        profile_id IN (
            SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub'
        )
    ); 