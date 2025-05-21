-- Create law_firm_associations table
CREATE TABLE IF NOT EXISTS law_firm_associations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
    is_primary BOOLEAN DEFAULT false,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(law_firm_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_law_firm_associations_law_firm_id ON law_firm_associations(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_law_firm_associations_user_id ON law_firm_associations(user_id);
CREATE INDEX IF NOT EXISTS idx_law_firm_associations_status ON law_firm_associations(status);
CREATE INDEX IF NOT EXISTS idx_law_firm_associations_is_primary ON law_firm_associations(is_primary);

-- Enable RLS
ALTER TABLE law_firm_associations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own firm associations"
    ON law_firm_associations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view associations for their firms"
    ON law_firm_associations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM law_firm_associations lfa
            WHERE lfa.law_firm_id = law_firm_associations.law_firm_id
            AND lfa.user_id = auth.uid()
            AND lfa.status = 'active'
        )
    );

-- Add trigger for updated_at
CREATE TRIGGER update_law_firm_associations_updated_at
    BEFORE UPDATE ON law_firm_associations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 