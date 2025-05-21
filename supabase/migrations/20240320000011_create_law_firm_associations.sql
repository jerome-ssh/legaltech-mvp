-- Create law_firm_associations table
CREATE TABLE IF NOT EXISTS law_firm_associations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    UNIQUE(profile_id, law_firm_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_law_firm_associations_profile_id ON law_firm_associations(profile_id);
CREATE INDEX IF NOT EXISTS idx_law_firm_associations_law_firm_id ON law_firm_associations(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_law_firm_associations_role_id ON law_firm_associations(role_id);
CREATE INDEX IF NOT EXISTS idx_law_firm_associations_status ON law_firm_associations(status);

-- Enable RLS
ALTER TABLE law_firm_associations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own firm associations"
    ON law_firm_associations FOR SELECT
    USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their own firm associations"
    ON law_firm_associations FOR ALL
    USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Create updated_at trigger
CREATE TRIGGER update_law_firm_associations_updated_at
    BEFORE UPDATE ON law_firm_associations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create audit trigger
CREATE TRIGGER audit_law_firm_associations
    AFTER INSERT OR UPDATE OR DELETE ON law_firm_associations
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes(); 