-- Create law_firms table
CREATE TABLE IF NOT EXISTS law_firms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_law_firms_name ON law_firms(name);

-- Enable RLS
ALTER TABLE law_firms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Law firms are viewable by all authenticated users" ON law_firms
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage law firms" ON law_firms
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER update_law_firms_updated_at
    BEFORE UPDATE ON law_firms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 