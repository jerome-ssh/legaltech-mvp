-- Drop existing enums if they exist
DROP TYPE IF EXISTS subscription_tier CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;

-- Create subscription_tier enum
CREATE TYPE subscription_tier AS ENUM (
    'basic',
    'professional',
    'enterprise'
);

-- Create subscription_status enum
CREATE TYPE subscription_status AS ENUM (
    'active',
    'inactive',
    'suspended',
    'trial'
);

-- Create law_firms table
CREATE TABLE IF NOT EXISTS law_firms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    subscription_tier subscription_tier DEFAULT 'basic',
    subscription_status subscription_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_law_firms_name ON law_firms(name);
CREATE INDEX IF NOT EXISTS idx_law_firms_subscription_tier ON law_firms(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_law_firms_subscription_status ON law_firms(subscription_status);

-- Enable RLS
ALTER TABLE law_firms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own firm"
    ON law_firms FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM law_firm_associations
            WHERE law_firm_id = law_firms.id
            AND user_id = auth.uid()
            AND status = 'active'
        )
    );

-- Create updated_at trigger
CREATE TRIGGER update_law_firms_updated_at
    BEFORE UPDATE ON law_firms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create audit trigger
CREATE TRIGGER audit_law_firms
    AFTER INSERT OR UPDATE OR DELETE ON law_firms
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes(); 