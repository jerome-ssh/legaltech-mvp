-- First, migrate data from text billing_frequency to enum billing_frequency_id
UPDATE matter_billing
SET billing_frequency_id = billing_frequency::billing_frequency_type
WHERE billing_frequency IS NOT NULL
AND billing_frequency IN (
    'Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly', 
    'Semi-Annual', 'Annual', 'Custom'
);

-- Migrate custom_terms to payment_terms if payment_terms is null
UPDATE matter_billing
SET payment_terms = custom_terms
WHERE payment_terms IS NULL AND custom_terms IS NOT NULL;

-- Drop redundant columns
ALTER TABLE matter_billing
    DROP COLUMN billing_frequency,
    DROP COLUMN custom_terms;

-- Add foreign key constraints for enum types
ALTER TABLE matter_billing
    ADD CONSTRAINT fk_matter_billing_billing_method 
    FOREIGN KEY (billing_method) 
    REFERENCES billing_methods(id);

ALTER TABLE matter_billing
    ADD CONSTRAINT fk_matter_billing_payment_pattern 
    FOREIGN KEY (payment_pattern) 
    REFERENCES payment_patterns(id);

-- Add foreign key constraint for billing_frequency_id
ALTER TABLE matter_billing
    ADD CONSTRAINT fk_matter_billing_frequency 
    FOREIGN KEY (billing_frequency_id) 
    REFERENCES billing_frequency_options(id);

-- Add check constraint to ensure custom_frequency is only set when billing_frequency_id is 'Custom'
ALTER TABLE matter_billing
    ADD CONSTRAINT check_custom_frequency
    CHECK (
        (billing_frequency_id = 'Custom' AND custom_frequency IS NOT NULL) OR
        (billing_frequency_id != 'Custom' AND custom_frequency IS NULL)
    );

-- Add check constraint for retainer fields
ALTER TABLE matter_billing
    ADD CONSTRAINT check_retainer_fields
    CHECK (
        (billing_method = 'Retainer' AND retainer_amount IS NOT NULL) OR
        (billing_method != 'Retainer')
    );

-- Add check constraint for rate field
ALTER TABLE matter_billing
    ADD CONSTRAINT check_rate_field
    CHECK (
        (billing_method IN ('Hourly', 'Flat Fee', 'Contingency') AND rate IS NOT NULL) OR
        (billing_method NOT IN ('Hourly', 'Flat Fee', 'Contingency'))
    );

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_matter_billing_billing_method 
ON matter_billing(billing_method);

CREATE INDEX IF NOT EXISTS idx_matter_billing_payment_pattern 
ON matter_billing(payment_pattern);

CREATE INDEX IF NOT EXISTS idx_matter_billing_billing_frequency_id 
ON matter_billing(billing_frequency_id);

-- Add comment to table
COMMENT ON TABLE matter_billing IS 'Stores billing information for legal matters';

-- Add comments to columns
COMMENT ON COLUMN matter_billing.billing_frequency_id IS 'References billing_frequency_options table for standardized billing frequencies';
COMMENT ON COLUMN matter_billing.custom_frequency IS 'Custom billing frequency description, only used when billing_frequency_id is Custom';
COMMENT ON COLUMN matter_billing.payment_terms IS 'Payment terms and conditions for the matter';
COMMENT ON COLUMN matter_billing.features IS 'JSON object containing billing features like automated_time_capture, blockchain_invoicing, etc.'; 