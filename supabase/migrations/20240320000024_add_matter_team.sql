-- Create matter_team table for team assignments
CREATE TABLE IF NOT EXISTS matter_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matter_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    is_lead BOOLEAN DEFAULT false,
    is_billing_attorney BOOLEAN DEFAULT false,
    is_responsible_attorney BOOLEAN DEFAULT false,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Add partial unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS unique_matter_lead 
    ON matter_team (matter_id) 
    WHERE is_lead = true;

CREATE UNIQUE INDEX IF NOT EXISTS unique_billing_attorney 
    ON matter_team (matter_id) 
    WHERE is_billing_attorney = true;

CREATE UNIQUE INDEX IF NOT EXISTS unique_responsible_attorney 
    ON matter_team (matter_id) 
    WHERE is_responsible_attorney = true;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_matter_team_matter_id ON matter_team(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_team_profile_id ON matter_team(profile_id);
CREATE INDEX IF NOT EXISTS idx_matter_team_role_id ON matter_team(role_id);
CREATE INDEX IF NOT EXISTS idx_matter_team_status ON matter_team(status);
CREATE INDEX IF NOT EXISTS idx_matter_team_created_by ON matter_team(created_by);
CREATE INDEX IF NOT EXISTS idx_matter_team_updated_by ON matter_team(updated_by);

-- Enable Row Level Security
ALTER TABLE matter_team ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view matter team members"
    ON matter_team
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = matter_team.matter_id
            AND (cases.client_id = auth.uid() OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = cases.profile_id 
                AND profiles.user_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Users can create matter team members"
    ON matter_team
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = matter_team.matter_id
            AND EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = cases.profile_id 
                AND profiles.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update matter team members"
    ON matter_team
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = matter_team.matter_id
            AND EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = cases.profile_id 
                AND profiles.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete matter team members"
    ON matter_team
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = matter_team.matter_id
            AND EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = cases.profile_id 
                AND profiles.user_id = auth.uid()
            )
        )
    );

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_matter_team_updated_at ON matter_team;
CREATE TRIGGER set_matter_team_updated_at
    BEFORE UPDATE ON matter_team
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for audit logging
CREATE TRIGGER audit_matter_team
    AFTER INSERT OR UPDATE OR DELETE ON matter_team
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

-- Add comments
COMMENT ON TABLE matter_team IS 'Tracks team members assigned to matters and their roles';
COMMENT ON COLUMN matter_team.is_lead IS 'Indicates if this team member is the lead on the matter';
COMMENT ON COLUMN matter_team.is_billing_attorney IS 'Indicates if this team member is the billing attorney';
COMMENT ON COLUMN matter_team.is_responsible_attorney IS 'Indicates if this team member is the responsible attorney';
COMMENT ON COLUMN matter_team.status IS 'Current status of the team member assignment'; 