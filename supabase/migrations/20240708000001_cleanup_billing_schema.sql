-- Clean up redundant billing fields and improve schema

-- First, create a new type for rate types
CREATE TYPE rate_type AS ENUM (
    'hourly',
    'flat',
    'contingency',
    'retainer'
);

-- Create a new type for billing terms
CREATE TYPE billing_terms_type AS ENUM (
    'standard',
    'custom'
);

-- Add new columns to matter_billing
ALTER TABLE public.matter_billing
    ADD COLUMN rate_type rate_type,
    ADD COLUMN terms_type billing_terms_type DEFAULT 'standard',
    ADD COLUMN terms_details jsonb;

-- Migrate existing data
UPDATE public.matter_billing
SET 
    rate_type = CASE 
        WHEN billing_method_id IN (SELECT id FROM billing_methods WHERE value = 'Hourly') THEN 'hourly'::rate_type
        WHEN billing_method_id IN (SELECT id FROM billing_methods WHERE value = 'Flat Fee') THEN 'flat'::rate_type
        WHEN billing_method_id IN (SELECT id FROM billing_methods WHERE value = 'Contingency') THEN 'contingency'::rate_type
        WHEN billing_method_id IN (SELECT id FROM billing_methods WHERE value = 'Retainer') THEN 'retainer'::rate_type
    END,
    terms_type = CASE 
        WHEN custom_terms IS NOT NULL THEN 'custom'::billing_terms_type
        ELSE 'standard'::billing_terms_type
    END,
    terms_details = jsonb_build_object(
        'standard', payment_terms,
        'custom', custom_terms
    );

-- Drop redundant columns
ALTER TABLE public.matter_billing
    DROP COLUMN IF EXISTS custom_terms,
    DROP COLUMN IF EXISTS custom_frequency;

-- Add check constraints
ALTER TABLE public.matter_billing
    ADD CONSTRAINT check_rate_type
    CHECK (
        (rate_type = 'hourly' AND billing_method_id IN (SELECT id FROM billing_methods WHERE value = 'Hourly')) OR
        (rate_type = 'flat' AND billing_method_id IN (SELECT id FROM billing_methods WHERE value = 'Flat Fee')) OR
        (rate_type = 'contingency' AND billing_method_id IN (SELECT id FROM billing_methods WHERE value = 'Contingency')) OR
        (rate_type = 'retainer' AND billing_method_id IN (SELECT id FROM billing_methods WHERE value = 'Retainer'))
    );

ALTER TABLE public.matter_billing
    ADD CONSTRAINT check_terms_type
    CHECK (
        (terms_type = 'standard' AND terms_details->>'standard' IS NOT NULL) OR
        (terms_type = 'custom' AND terms_details->>'custom' IS NOT NULL)
    );

-- Add comments
COMMENT ON COLUMN public.matter_billing.rate_type IS 'Type of rate (hourly, flat, contingency, retainer)';
COMMENT ON COLUMN public.matter_billing.terms_type IS 'Type of terms (standard or custom)';
COMMENT ON COLUMN public.matter_billing.terms_details IS 'JSON object containing both standard and custom terms';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_matter_billing_rate_type ON public.matter_billing(rate_type);
CREATE INDEX IF NOT EXISTS idx_matter_billing_terms_type ON public.matter_billing(terms_type); 