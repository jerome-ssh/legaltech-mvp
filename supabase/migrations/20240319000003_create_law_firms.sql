-- Create law_firms table
CREATE TABLE IF NOT EXISTS law_firms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    website TEXT,
    logo_url TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_law_firms_name ON law_firms(name);
CREATE INDEX IF NOT EXISTS idx_law_firms_status ON law_firms(status);
CREATE INDEX IF NOT EXISTS idx_law_firms_created_by ON law_firms(created_by);

-- Enable RLS
ALTER TABLE law_firms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active law firms"
    ON law_firms FOR SELECT
    USING (status = 'active');

-- Create trigger for updated_at
CREATE TRIGGER update_law_firms_updated_at
    BEFORE UPDATE ON law_firms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create audit trigger
CREATE TRIGGER audit_law_firms
    AFTER INSERT OR UPDATE OR DELETE ON law_firms
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes(); 