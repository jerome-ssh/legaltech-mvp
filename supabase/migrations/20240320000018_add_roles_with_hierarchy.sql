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

-- Add role_level column to roles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'roles' 
        AND column_name = 'role_level'
    ) THEN
        ALTER TABLE roles ADD COLUMN role_level role_level NOT NULL DEFAULT 'professional';
    END IF;
END $$;

-- Add other required columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'roles' 
        AND column_name = 'is_firm_specific'
    ) THEN
        ALTER TABLE roles ADD COLUMN is_firm_specific BOOLEAN NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'roles' 
        AND column_name = 'permissions'
    ) THEN
        ALTER TABLE roles ADD COLUMN permissions JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'roles' 
        AND column_name = 'parent_role_id'
    ) THEN
        ALTER TABLE roles ADD COLUMN parent_role_id UUID REFERENCES roles(id);
    END IF;
END $$;

-- Insert system-level roles
INSERT INTO roles (name, description, role_level, is_firm_specific, permissions) VALUES
    ('platform_admin', 'Platform administrator with full system access', 'system', false, 
    '{"can_manage_platform": true, "can_manage_firms": true, "can_manage_users": true, "can_view_analytics": true}'::jsonb),
    ('support_staff', 'Platform support staff', 'system', false,
    '{"can_view_platform_analytics": true, "can_manage_support_tickets": true, "can_view_users": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Insert firm-level roles with hierarchy
WITH firm_roles AS (
    INSERT INTO roles (name, description, role_level, is_firm_specific, permissions) VALUES
        ('managing_partner', 'Managing partner with full firm access', 'firm_admin', true,
        '{"can_manage_firm": true, "can_manage_users": true, "can_manage_billing": true, "can_view_analytics": true, "can_manage_cases": true, "can_manage_documents": true}'::jsonb),
        ('partner', 'Firm partner with management access', 'management', true,
        '{"can_manage_cases": true, "can_manage_team": true, "can_view_analytics": true, "can_manage_documents": true}'::jsonb),
        ('senior_associate', 'Senior associate attorney', 'professional', true,
        '{"can_manage_cases": true, "can_manage_documents": true, "can_view_analytics": true}'::jsonb),
        ('associate', 'Associate attorney', 'professional', true,
        '{"can_manage_cases": true, "can_manage_documents": true}'::jsonb),
        ('paralegal', 'Legal support staff', 'support', true,
        '{"can_view_cases": true, "can_manage_documents": true, "can_create_tasks": true}'::jsonb),
        ('legal_assistant', 'Legal assistant', 'support', true,
        '{"can_view_cases": true, "can_manage_documents": true, "can_create_tasks": true}'::jsonb),
        ('admin_staff', 'Administrative staff', 'support', true,
        '{"can_manage_calendar": true, "can_manage_documents": true, "can_create_tasks": true}'::jsonb)
    RETURNING id, name
)
SELECT id, name FROM firm_roles;

-- Update parent_role_id to establish hierarchy
UPDATE roles
SET parent_role_id = (SELECT id FROM roles WHERE name = 'managing_partner')
WHERE name IN ('partner', 'senior_associate', 'associate', 'paralegal', 'legal_assistant', 'admin_staff');

UPDATE roles
SET parent_role_id = (SELECT id FROM roles WHERE name = 'partner')
WHERE name IN ('senior_associate', 'associate');

UPDATE roles
SET parent_role_id = (SELECT id FROM roles WHERE name = 'senior_associate')
WHERE name = 'associate'; 