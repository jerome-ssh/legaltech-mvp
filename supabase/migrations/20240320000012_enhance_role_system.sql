-- Create role_level enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_level') THEN
        CREATE TYPE role_level AS ENUM (
            'system',      -- Platform-level roles
            'firm_admin',  -- Firm administration
            'management',  -- Firm management
            'professional', -- Legal professionals
            'support'      -- Support staff
        );
    END IF;
END $$;

-- Enhance roles table
ALTER TABLE roles
    ADD COLUMN IF NOT EXISTS role_level role_level NOT NULL DEFAULT 'professional',
    ADD COLUMN IF NOT EXISTS is_firm_specific BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS max_admins INTEGER DEFAULT 3,
    ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS parent_role_id UUID REFERENCES roles(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_roles_role_level ON roles(role_level);
CREATE INDEX IF NOT EXISTS idx_roles_is_firm_specific ON roles(is_firm_specific);
CREATE INDEX IF NOT EXISTS idx_roles_parent_role_id ON roles(parent_role_id);

-- Insert system roles
INSERT INTO roles (name, description, role_level, is_firm_specific, permissions) VALUES
    ('platform_admin', 'Platform administrator with full system access', 'system', false, 
    '{"can_manage_platform": true, "can_manage_firms": true}'::jsonb),
    ('support_staff', 'Platform support staff', 'system', false,
    '{"can_view_platform_analytics": true, "can_manage_support_tickets": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Insert firm roles with hierarchy
WITH firm_roles AS (
    INSERT INTO roles (name, description, role_level, is_firm_specific, permissions) VALUES
        ('managing_partner', 'Managing partner with full firm access', 'firm_admin', true,
        '{"can_manage_firm": true, "can_manage_users": true, "can_manage_billing": true, "can_view_analytics": true}'::jsonb),
        ('partner', 'Firm partner with management access', 'management', true,
        '{"can_manage_cases": true, "can_manage_team": true, "can_view_analytics": true}'::jsonb),
        ('senior_associate', 'Senior associate attorney', 'professional', true,
        '{"can_manage_cases": true, "can_manage_documents": true}'::jsonb),
        ('associate', 'Associate attorney', 'professional', true,
        '{"can_manage_cases": true, "can_manage_documents": true}'::jsonb),
        ('paralegal', 'Legal support staff', 'support', true,
        '{"can_view_cases": true, "can_manage_documents": true}'::jsonb),
        ('legal_assistant', 'Legal assistant', 'support', true,
        '{"can_view_cases": true, "can_manage_documents": true}'::jsonb),
        ('admin_staff', 'Administrative staff', 'support', true,
        '{"can_manage_calendar": true, "can_manage_documents": true}'::jsonb)
    RETURNING id, name
)
SELECT id, name FROM firm_roles;

-- Create function to check admin count
CREATE OR REPLACE FUNCTION check_admin_count()
RETURNS TRIGGER AS $$
DECLARE
    admin_count INTEGER;
    max_admins INTEGER;
BEGIN
    -- Get the role's max_admins
    SELECT r.max_admins INTO max_admins
    FROM roles r
    WHERE r.id = NEW.role_id;

    -- Count current admins
    SELECT COUNT(*) INTO admin_count
    FROM law_firm_associations lfa
    JOIN roles r ON r.id = lfa.role_id
    WHERE lfa.law_firm_id = NEW.law_firm_id
    AND r.role_level = 'firm_admin'
    AND lfa.status = 'active';

    -- Check if adding another admin would exceed the limit
    IF NEW.role_id IN (SELECT id FROM roles WHERE role_level = 'firm_admin')
    AND admin_count >= max_admins THEN
        RAISE EXCEPTION 'Maximum number of admins reached for this firm';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for admin count check
CREATE TRIGGER check_admin_count_trigger
    BEFORE INSERT OR UPDATE ON law_firm_associations
    FOR EACH ROW
    EXECUTE FUNCTION check_admin_count();

-- Add comments for documentation
COMMENT ON COLUMN roles.role_level IS 'Hierarchical level of the role in the system';
COMMENT ON COLUMN roles.is_firm_specific IS 'Whether this role is specific to firms or system-wide';
COMMENT ON COLUMN roles.max_admins IS 'Maximum number of users allowed with this role (for admin roles)';
COMMENT ON COLUMN roles.permissions IS 'JSON object containing role-specific permissions';
COMMENT ON COLUMN roles.parent_role_id IS 'Reference to parent role for role hierarchy'; 