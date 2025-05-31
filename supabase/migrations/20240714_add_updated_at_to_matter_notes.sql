-- Migration: Add updated_at column to matter_notes
ALTER TABLE public.matter_notes
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for matter_notes
DROP TRIGGER IF EXISTS update_matter_notes_updated_at ON public.matter_notes;
CREATE TRIGGER update_matter_notes_updated_at
    BEFORE UPDATE ON public.matter_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 