-- Clean up all redundant billing fields

-- First, create the rate_type ENUM if it doesn't exist
DO $$ BEGIN
    CREATE TYPE rate_type AS ENUM (
        'hourly',
        'flat',
        'contingency',
        'retainer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Then add the new columns if they don't exist
ALTER TABLE public.matter_billing
    ADD COLUMN IF NOT EXISTS terms_details jsonb,
    ADD COLUMN IF NOT EXISTS rate_type rate_type,
    ADD COLUMN IF NOT EXISTS rate_value numeric,
    ADD COLUMN IF NOT EXISTS notes text;

-- Then migrate the data to the new structure
UPDATE public.matter_billing
SET 
    terms_details = jsonb_build_object(
        'standard', payment_terms,
        'custom', custom_terms
    ),
    notes = billing_notes
WHERE terms_details IS NULL;

-- Drop all redundant columns
ALTER TABLE public.matter_billing
    DROP COLUMN IF EXISTS custom_terms,
    DROP COLUMN IF EXISTS custom_frequency,
    DROP COLUMN IF EXISTS payment_terms,  -- Now stored in terms_details
    DROP COLUMN IF EXISTS hourly_rate,    -- Now stored in rate_value
    DROP COLUMN IF EXISTS flat_fee_amount, -- Now stored in rate_value
    DROP COLUMN IF EXISTS contingency_percentage, -- Now stored in rate_value
    DROP COLUMN IF EXISTS subscription_amount, -- Now stored in rate_value
    DROP COLUMN IF EXISTS billing_notes;  -- Now stored in notes

-- Add comments to clarify the new structure
COMMENT ON TABLE public.matter_billing IS 'Billing information for matters with consolidated rate and terms fields';
COMMENT ON COLUMN public.matter_billing.rate_value IS 'The actual rate value, type determined by rate_type';
COMMENT ON COLUMN public.matter_billing.terms_details IS 'JSON object containing both standard and custom terms';
COMMENT ON COLUMN public.matter_billing.notes IS 'General billing notes and comments';

-- Create a view to help with backward compatibility
CREATE OR REPLACE VIEW public.matter_billing_legacy AS
SELECT 
    id,
    matter_id,
    billing_method,
    payment_pattern,
    currency,
    payment_medium,
    rate_value,
    rate_type,
    terms_details->>'standard' as payment_terms,
    terms_details->>'custom' as custom_terms,
    billing_frequency,
    features->>'automated_time_capture' as automated_time_capture,
    features->>'blockchain_invoicing' as blockchain_invoicing,
    features->>'send_invoice_on_approval' as send_invoice_on_approval,
    retainer_amount,
    retainer_balance,
    notes as billing_notes,
    created_at,
    updated_at
FROM public.matter_billing; 