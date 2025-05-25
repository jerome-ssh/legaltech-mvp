-- Add completed_at column to matter_intake_links table
ALTER TABLE public.matter_intake_links
    ADD COLUMN completed_at timestamp with time zone;

-- Add check constraint for status
ALTER TABLE public.matter_intake_links
    ADD CONSTRAINT valid_status 
    CHECK (status = ANY (ARRAY['pending', 'sent', 'completed', 'expired']));

-- Add index for status for better query performance
CREATE INDEX idx_matter_intake_links_status ON public.matter_intake_links(status);

-- Add comment
COMMENT ON COLUMN public.matter_intake_links.completed_at IS 'Timestamp when the intake form was completed'; 