-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view clients"
    ON clients FOR SELECT
    USING (true);

CREATE POLICY "Users can insert clients"
    ON clients FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update clients"
    ON clients FOR UPDATE
    USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert test clients
INSERT INTO clients (
    id,
    name,
    email,
    phone,
    address,
    notes,
    created_at,
    updated_at
) VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tech Corp', 'contact@techcorp.com', '+1234567890', '123 Tech Street, New York, NY', 'Technology company specializing in software development', NOW(), NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Innovate Inc', 'info@innovateinc.com', '+1234567891', '456 Innovation Ave, San Francisco, CA', 'Innovation and research company', NOW(), NOW()),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Legal Solutions LLC', 'contact@legalsolutions.com', '+1234567892', '789 Legal Blvd, Austin, TX', 'Legal services provider', NOW(), NOW())
ON CONFLICT (id) DO NOTHING; 