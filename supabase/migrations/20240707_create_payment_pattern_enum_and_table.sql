-- Create ENUM type for payment_pattern
CREATE TYPE payment_pattern_type AS ENUM (
  'Standard',
  'Block',
  'Subscription',
  'Contingency',
  'Hybrid'
);

-- Rename the column if it exists as billing_type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='matter_billing' AND column_name='billing_type'
  ) THEN
    EXECUTE 'ALTER TABLE public.matter_billing RENAME COLUMN billing_type TO payment_pattern;';
  END IF;
END $$;

-- Alter matter_billing.payment_pattern to use the new ENUM type
ALTER TABLE public.matter_billing
  ALTER COLUMN payment_pattern TYPE payment_pattern_type
  USING payment_pattern::payment_pattern_type;

-- Create a lookup table for payment patterns
CREATE TABLE public.payment_patterns (
  value payment_pattern_type PRIMARY KEY,
  label text NOT NULL,
  description text,
  icon text
);

-- Seed the table
INSERT INTO public.payment_patterns (value, label, description, icon) VALUES
  ('Standard', 'Standard (regular invoicing)', 'Regular periodic invoicing', 'standard-icon'),
  ('Block', 'Block', 'Block of hours or services', 'block-icon'),
  ('Subscription', 'Subscription', 'Recurring payments', 'subscription-icon'),
  ('Contingency', 'Contingency', 'Payment upon success', 'contingency-icon'),
  ('Hybrid', 'Hybrid', 'Combination of methods', 'hybrid-icon'); 