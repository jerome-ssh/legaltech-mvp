-- Create law_firm_associations table
CREATE TABLE IF NOT EXISTS law_firm_associations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- e.g., 'partner', 'associate', 'of_counsel', 'contractor'
    start_date DATE NOT NULL,
    end_date DATE,
    is_primary BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active', -- e.g., 'active', 'inactive', 'pending'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_dates CHECK (
        (end_date IS NULL OR end_date >= start_date)
    )
);

-- Add a separate unique index for the partial unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS unique_primary_association
    ON law_firm_associations(profile_id)
    WHERE is_primary = true;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_law_firm_associations_profile_id ON law_firm_associations(profile_id);
CREATE INDEX IF NOT EXISTS idx_law_firm_associations_law_firm_id ON law_firm_associations(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_law_firm_associations_status ON law_firm_associations(status);

-- Add trigger for updated_at
CREATE TRIGGER update_law_firm_associations_updated_at
    BEFORE UPDATE ON law_firm_associations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE law_firm_associations ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own associations
CREATE POLICY "Users can view their own associations"
    ON law_firm_associations
    FOR SELECT
    USING (auth.uid() = profile_id);

-- Allow users to manage their own associations
CREATE POLICY "Users can manage their own associations"
    ON law_firm_associations
    FOR ALL
    USING (auth.uid() = profile_id);

-- Allow law firm admins to view associations for their firm
CREATE POLICY "Law firm admins can view firm associations"
    ON law_firm_associations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM law_firms
            WHERE id = law_firm_id
            AND EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid()
                AND role = 'admin'
            )
        )
    );

-- Add function to update primary association
CREATE OR REPLACE FUNCTION update_primary_association()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        -- Set all other associations for this profile to non-primary
        UPDATE law_firm_associations
        SET is_primary = false
        WHERE profile_id = NEW.profile_id
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for primary association
CREATE TRIGGER update_primary_association_trigger
    BEFORE INSERT OR UPDATE ON law_firm_associations
    FOR EACH ROW
    EXECUTE FUNCTION update_primary_association(); 