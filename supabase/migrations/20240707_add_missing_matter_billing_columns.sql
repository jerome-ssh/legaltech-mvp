-- Add missing columns to matter_billing for full API/Frontend support
ALTER TABLE public.matter_billing
  ADD COLUMN IF NOT EXISTS payment_terms text,
  ADD COLUMN IF NOT EXISTS retainer_amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS retainer_balance numeric(10,2),
  ADD COLUMN IF NOT EXISTS billing_frequency text,
  ADD COLUMN IF NOT EXISTS custom_frequency text,
  ADD COLUMN IF NOT EXISTS billing_notes text,
  ADD COLUMN IF NOT EXISTS features jsonb; 