-- Create billing_methods table
CREATE TABLE billing_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    value billing_method_type NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default billing methods
INSERT INTO billing_methods (value, label, description) VALUES
    ('Hourly', 'Hourly Rate', 'Billing based on time spent'),
    ('Flat Fee', 'Flat Fee', 'Fixed amount for the entire matter'),
    ('Contingency', 'Contingency', 'Payment based on case outcome'),
    ('Retainer', 'Retainer', 'Pre-paid amount for future services'),
    ('Subscription', 'Subscription', 'Regular recurring payments'),
    ('Pro Bono', 'Pro Bono', 'No charge for services rendered'),
    ('Other', 'Other', 'Other billing arrangement');

-- Add RLS policies
ALTER TABLE billing_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON billing_methods
    FOR SELECT
    USING (true);

-- Create function to get active billing methods
CREATE OR REPLACE FUNCTION get_active_billing_methods()
RETURNS TABLE (
    id UUID,
    value billing_method_type,
    label TEXT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bm.id,
        bm.value,
        bm.label,
        bm.description
    FROM billing_methods bm
    WHERE bm.is_active = true
    ORDER BY bm.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update matter_billing table to use UUID for billing_method
ALTER TABLE matter_billing
    DROP CONSTRAINT IF EXISTS fk_matter_billing_billing_method;

-- Add new column for UUID reference
ALTER TABLE matter_billing
    ADD COLUMN billing_method_id UUID;

-- Update existing records to use UUID references
UPDATE matter_billing mb
SET billing_method_id = bm.id
FROM billing_methods bm
WHERE mb.billing_method = bm.value;

-- Drop the old billing_method column
ALTER TABLE matter_billing
    DROP COLUMN billing_method;

-- Add foreign key constraint
ALTER TABLE matter_billing
    ADD CONSTRAINT fk_matter_billing_billing_method 
    FOREIGN KEY (billing_method_id) 
    REFERENCES billing_methods(id);

-- Update check constraints to use billing_method_id
ALTER TABLE matter_billing
    DROP CONSTRAINT IF EXISTS check_retainer_fields;

ALTER TABLE matter_billing
    ADD CONSTRAINT check_retainer_fields
    CHECK (
        (billing_method_id IN (SELECT id FROM billing_methods WHERE value = 'Retainer') AND retainer_amount IS NOT NULL) OR
        (billing_method_id NOT IN (SELECT id FROM billing_methods WHERE value = 'Retainer'))
    );

ALTER TABLE matter_billing
    DROP CONSTRAINT IF EXISTS check_rate_field;

ALTER TABLE matter_billing
    ADD CONSTRAINT check_rate_field
    CHECK (
        (billing_method_id IN (SELECT id FROM billing_methods WHERE value IN ('Hourly', 'Flat Fee', 'Contingency')) AND rate IS NOT NULL) OR
        (billing_method_id NOT IN (SELECT id FROM billing_methods WHERE value IN ('Hourly', 'Flat Fee', 'Contingency')))
    );

-- Add index for billing_method_id
CREATE INDEX IF NOT EXISTS idx_matter_billing_billing_method_id 
ON matter_billing(billing_method_id);

-- Add comment
COMMENT ON TABLE billing_methods IS 'Reference table for billing methods';
COMMENT ON COLUMN matter_billing.billing_method_id IS 'References billing_methods table for standardized billing methods';

-- Update descriptions for all billing methods
UPDATE billing_methods SET description = 'Billing based on time spent' WHERE value::text = 'Hourly';
UPDATE billing_methods SET description = 'Fixed amount for the entire matter' WHERE value::text = 'Flat Fee';
UPDATE billing_methods SET description = 'Payment based on case outcome' WHERE value::text = 'Contingency';
UPDATE billing_methods SET description = 'Pre-paid amount for future services' WHERE value::text = 'Retainer';
UPDATE billing_methods SET description = 'Regular recurring payments' WHERE value::text = 'Subscription';
UPDATE billing_methods SET description = 'No charge for services rendered' WHERE value::text = 'Pro Bono';
UPDATE billing_methods SET description = 'Other billing arrangement' WHERE value::text = 'Other'; 