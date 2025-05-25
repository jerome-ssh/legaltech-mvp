-- Drop old columns that are no longer needed
ALTER TABLE public.clients
    DROP COLUMN IF EXISTS title,
    DROP COLUMN IF EXISTS phone,
    DROP COLUMN IF EXISTS preferred_language,
    DROP COLUMN IF EXISTS client_type;

-- Add foreign key constraints
ALTER TABLE public.clients
    ADD CONSTRAINT fk_clients_title_id
    FOREIGN KEY (title_id)
    REFERENCES public.titles(id);

ALTER TABLE public.clients
    ADD CONSTRAINT fk_clients_client_type_id
    FOREIGN KEY (client_type_id)
    REFERENCES public.client_types(id);

ALTER TABLE public.clients
    ADD CONSTRAINT fk_clients_preferred_language_id
    FOREIGN KEY (preferred_language_id)
    REFERENCES public.languages(id);

-- Make required columns NOT NULL
ALTER TABLE public.clients
    ALTER COLUMN title_id SET NOT NULL,
    ALTER COLUMN client_type_id SET NOT NULL,
    ALTER COLUMN preferred_language_id SET NOT NULL,
    ALTER COLUMN phone_number SET NOT NULL;

-- Add check constraint for phone number format
ALTER TABLE public.clients
    ADD CONSTRAINT valid_phone_number 
    CHECK (phone_number ~ '^\+[1-9]\d{1,14}$');

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_title_id ON public.clients(title_id);
CREATE INDEX IF NOT EXISTS idx_clients_client_type_id ON public.clients(client_type_id);
CREATE INDEX IF NOT EXISTS idx_clients_preferred_language_id ON public.clients(preferred_language_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone_number ON public.clients(phone_number); 