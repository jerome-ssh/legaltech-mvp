-- Add profile_id column to matter_intake_links table
ALTER TABLE public.matter_intake_links
    ADD COLUMN profile_id uuid REFERENCES public.profiles(id);

-- Add index for better query performance
CREATE INDEX idx_matter_intake_links_profile_id ON public.matter_intake_links(profile_id);

-- Add comment
COMMENT ON COLUMN public.matter_intake_links.profile_id IS 'The profile ID of the firm/lawyer who created the intake link'; 