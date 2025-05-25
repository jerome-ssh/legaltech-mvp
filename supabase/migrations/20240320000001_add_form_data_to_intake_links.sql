-- Add form_data column to matter_intake_links table
ALTER TABLE public.matter_intake_links
    ADD COLUMN form_data jsonb;

COMMENT ON COLUMN public.matter_intake_links.form_data IS 'Stores the submitted form data as JSON';
