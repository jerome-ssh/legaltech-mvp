-- Add billing_method_id as a foreign key to billing_methods
ALTER TABLE public.matter_billing
  ADD COLUMN IF NOT EXISTS billing_method_id uuid,
  ADD CONSTRAINT fk_matter_billing_billing_method
    FOREIGN KEY (billing_method_id)
    REFERENCES public.billing_methods(id);

-- Remove legacy rate and rate_type columns if they exist
ALTER TABLE public.matter_billing
  DROP COLUMN IF EXISTS rate,
  DROP COLUMN IF EXISTS rate_type; 