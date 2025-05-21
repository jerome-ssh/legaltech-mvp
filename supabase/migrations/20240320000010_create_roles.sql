-- Drop existing enum if it exists
DROP TYPE IF EXISTS role_level CASCADE;

-- Create role_level enum
CREATE TYPE role_level AS ENUM (
    'system',      -- Platform-level roles
    'firm_admin',  -- Firm administration
    'management',  -- Firm management
    'professional', -- Legal professionals
    'support'      -- Support staff
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    role_level role_level NOT NULL DEFAULT 'professional',
    is_firm_specific BOOLEAN NOT NULL DEFAULT false,
    max_admins INTEGER DEFAULT 3,
    permissions JSONB DEFAULT '{}'::jsonb,
    parent_role_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_role_level ON roles(role_level);
CREATE INDEX IF NOT EXISTS idx_roles_is_firm_specific ON roles(is_firm_specific);
CREATE INDEX IF NOT EXISTS idx_roles_parent_role_id ON roles(parent_role_id);

-- Add the self-referential foreign key constraint
ALTER TABLE roles 
    ADD CONSTRAINT fk_roles_parent_role 
    FOREIGN KEY (parent_role_id) 
    REFERENCES roles(id);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Everyone can view roles"
    ON roles FOR SELECT
    USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create audit trigger
CREATE TRIGGER audit_roles
    AFTER INSERT OR UPDATE OR DELETE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

-- Insert default roles
INSERT INTO roles (name, description, role_level, is_firm_specific, permissions) VALUES
    ('platform_admin', 'Platform administrator with full system access', 'system', false, 
    '{"can_manage_platform": true, "can_manage_firms": true}'::jsonb),
    ('support_staff', 'Platform support staff', 'system', false,
    '{"can_view_platform_analytics": true, "can_manage_support_tickets": true}'::jsonb),
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
ON CONFLICT (name) DO NOTHING; 