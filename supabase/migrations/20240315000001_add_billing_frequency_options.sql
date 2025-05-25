-- Create enum type for billing frequency
CREATE TYPE billing_frequency_type AS ENUM (
    'Weekly',
    'Bi-Weekly',
    'Monthly',
    'Quarterly',
    'Semi-Annual',
    'Annual',
    'Custom'
);

-- Add billing_frequency_id column to matter_billing table
ALTER TABLE matter_billing
ADD COLUMN billing_frequency_id billing_frequency_type;

-- Create billing_frequency_options table
CREATE TABLE billing_frequency_options (
    id SERIAL PRIMARY KEY,
    value billing_frequency_type NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default billing frequency options
INSERT INTO billing_frequency_options (value, label, description) VALUES
    ('Weekly', 'Weekly', 'Billing occurs every week'),
    ('Bi-Weekly', 'Bi-Weekly', 'Billing occurs every two weeks'),
    ('Monthly', 'Monthly', 'Billing occurs once per month'),
    ('Quarterly', 'Quarterly', 'Billing occurs every three months'),
    ('Semi-Annual', 'Semi-Annual', 'Billing occurs every six months'),
    ('Annual', 'Annual', 'Billing occurs once per year'),
    ('Custom', 'Custom', 'Custom billing frequency');

-- Add RLS policies
ALTER TABLE billing_frequency_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON billing_frequency_options
    FOR SELECT
    USING (true);

-- Create function to get active billing frequency options
CREATE OR REPLACE FUNCTION get_active_billing_frequency_options()
RETURNS TABLE (
    id INTEGER,
    value billing_frequency_type,
    label TEXT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bfo.id,
        bfo.value,
        bfo.label,
        bfo.description
    FROM billing_frequency_options bfo
    WHERE bfo.is_active = true
    ORDER BY bfo.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 