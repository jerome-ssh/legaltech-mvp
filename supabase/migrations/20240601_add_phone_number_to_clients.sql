-- Add phone_number column with proper validation
ALTER TABLE public.clients
    ADD COLUMN phone_number TEXT;

-- Add comment to clarify phone number format
COMMENT ON COLUMN public.clients.phone_number IS 'International phone number with country code, e.g. +12025550123';

-- Add check constraint for phone number format
ALTER TABLE public.clients
    ADD CONSTRAINT valid_phone_number 
    CHECK (phone_number ~ '^\+[1-9]\d{1,14}$');

-- Update existing records to ensure proper format
UPDATE public.clients
SET phone_number = CASE 
    WHEN phone ~ '^\+' THEN phone
    WHEN phone ~ '^1' THEN '+' || phone
    ELSE '+1' || regexp_replace(phone, '[^0-9]', '', 'g')
END
WHERE phone IS NOT NULL;

-- Drop the old phone column
ALTER TABLE public.clients
    DROP COLUMN IF EXISTS phone;

-- Add index for phone number searches
CREATE INDEX idx_clients_phone_number ON public.clients(phone_number); 