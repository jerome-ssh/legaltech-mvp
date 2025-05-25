-- Add payment_medium column to matter_billing
ALTER TABLE public.matter_billing
  ADD COLUMN payment_medium uuid NULL REFERENCES public.payment_mediums(id); 