-- Add foreign key columns to clients table
ALTER TABLE public.clients
    ADD COLUMN title_id INTEGER REFERENCES public.titles(id),
    ADD COLUMN client_type_id INTEGER REFERENCES public.client_types(id),
    ADD COLUMN preferred_language_id INTEGER REFERENCES public.languages(id);

-- Update existing records with default values
UPDATE public.clients
SET 
    title_id = (SELECT id FROM public.titles WHERE value = 'Other'),
    client_type_id = (SELECT id FROM public.client_types WHERE value = 'Individual'),
    preferred_language_id = (SELECT id FROM public.languages WHERE value = 'English')
WHERE title_id IS NULL;

-- Make the new columns required
ALTER TABLE public.clients
    ALTER COLUMN title_id SET NOT NULL,
    ALTER COLUMN client_type_id SET NOT NULL,
    ALTER COLUMN preferred_language_id SET NOT NULL;

-- Drop the old columns that are being replaced
ALTER TABLE public.clients
    DROP COLUMN IF EXISTS title,
    DROP COLUMN IF EXISTS client_type,
    DROP COLUMN IF EXISTS preferred_language;

-- Add indexes for better query performance
CREATE INDEX idx_clients_title_id ON public.clients(title_id);
CREATE INDEX idx_clients_client_type_id ON public.clients(client_type_id);
CREATE INDEX idx_clients_preferred_language_id ON public.clients(preferred_language_id); 