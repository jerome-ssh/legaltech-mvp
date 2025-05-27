-- Add payment_medium_id column to matter_billing
ALTER TABLE public.matter_billing
  ADD COLUMN payment_medium_id uuid NULL REFERENCES public.payment_mediums(id);

-- Add comment to explain the column
COMMENT ON COLUMN public.matter_billing.payment_medium_id IS 'Foreign key reference to payment_mediums table. Required for all billing methods except Pro Bono.';

-- Rename payment_medium to payment_medium_id
ALTER TABLE public.matter_billing RENAME COLUMN payment_medium TO payment_medium_id; 