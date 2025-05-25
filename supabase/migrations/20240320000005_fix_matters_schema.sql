-- Add status column to matters table
ALTER TABLE public.matters
    ADD COLUMN status text DEFAULT 'active';

-- Add check constraint for status
ALTER TABLE public.matters
    ADD CONSTRAINT valid_matter_status 
    CHECK (status = ANY (ARRAY['active', 'closed', 'on_hold', 'pending', 'intake_completed']));

-- Add index for status for better query performance
CREATE INDEX idx_matters_status ON public.matters(status);

-- Add comment
COMMENT ON COLUMN public.matters.status IS 'Current status of the matter'; 