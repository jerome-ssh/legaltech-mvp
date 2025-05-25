-- Drop the old phone column and trigger
ALTER TABLE public.clients
    DROP COLUMN IF EXISTS phone;

DROP TRIGGER IF EXISTS ensure_phone_not_null_trigger ON public.clients;
DROP FUNCTION IF EXISTS public.ensure_phone_not_null();

-- Ensure phone_number has proper constraints
ALTER TABLE public.clients
    ALTER COLUMN phone_number SET NOT NULL,
    ADD CONSTRAINT valid_phone_number 
    CHECK (phone_number ~ '^\+[1-9]\d{1,14}$');

-- Add index for phone number searches
CREATE INDEX IF NOT EXISTS idx_clients_phone_number ON public.clients(phone_number);

-- Add comment
COMMENT ON COLUMN public.clients.phone_number IS 'International phone number with country code, e.g. +12025550123'; 