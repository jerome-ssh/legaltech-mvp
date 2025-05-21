-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view roles"
    ON roles FOR SELECT
    USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
    ('admin', 'Administrator with full access', '{"all": true}'::jsonb),
    ('partner', 'Partner with management access', '{"manage_cases": true, "manage_team": true, "view_analytics": true, "manage_documents": true}'::jsonb),
    ('senior_associate', 'Senior Associate with professional access', '{"manage_cases": true, "manage_documents": true, "view_analytics": true}'::jsonb),
    ('associate', 'Associate with basic access', '{"manage_cases": true, "manage_documents": true}'::jsonb),
    ('paralegal', 'Paralegal with support access', '{"view_cases": true, "manage_documents": true, "create_tasks": true}'::jsonb),
    ('legal_assistant', 'Legal Assistant with support access', '{"view_cases": true, "manage_documents": true, "create_tasks": true}'::jsonb),
    ('admin_staff', 'Administrative Staff with basic access', '{"manage_calendar": true, "manage_documents": true, "create_tasks": true}'::jsonb)
ON CONFLICT (name) DO NOTHING; 