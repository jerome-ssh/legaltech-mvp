-- Create matter_billing table for per-matter billing setup
CREATE TABLE IF NOT EXISTS matter_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matter_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    billing_type TEXT NOT NULL CHECK (billing_type IN (
        'hourly',
        'fixed',
        'contingency',
        'hybrid',
        'block_fee',
        'subscription'
    )),
    rate DECIMAL(10,2),
    currency TEXT NOT NULL DEFAULT 'USD',
    payment_terms TEXT,
    retainer_amount DECIMAL(10,2),
    retainer_balance DECIMAL(10,2),
    billing_frequency TEXT CHECK (billing_frequency IN (
        'monthly',
        'quarterly',
        'upon_completion',
        'milestone',
        'custom'
    )),
    custom_frequency JSONB,
    billing_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_matter_billing_matter_id ON matter_billing(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_billing_billing_type ON matter_billing(billing_type);
CREATE INDEX IF NOT EXISTS idx_matter_billing_created_by ON matter_billing(created_by);
CREATE INDEX IF NOT EXISTS idx_matter_billing_updated_by ON matter_billing(updated_by);

-- Enable Row Level Security
ALTER TABLE matter_billing ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view matter billing"
    ON matter_billing
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = matter_billing.matter_id
            AND (cases.client_id = auth.uid() OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = cases.profile_id 
                AND profiles.user_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Users can create matter billing"
    ON matter_billing
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = matter_billing.matter_id
            AND EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = cases.profile_id 
                AND profiles.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update matter billing"
    ON matter_billing
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = matter_billing.matter_id
            AND EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = cases.profile_id 
                AND profiles.user_id = auth.uid()
            )
        )
    );

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_matter_billing_updated_at ON matter_billing;
CREATE TRIGGER set_matter_billing_updated_at
    BEFORE UPDATE ON matter_billing
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for audit logging
CREATE TRIGGER audit_matter_billing
    AFTER INSERT OR UPDATE OR DELETE ON matter_billing
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes(); 