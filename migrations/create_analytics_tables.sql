-- Drop existing tables if they exist
DROP TABLE IF EXISTS billing CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS client_feedback CASCADE;

-- Create billing table
CREATE TABLE billing (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    month TEXT,
    paid DECIMAL(10,2) DEFAULT 0,
    outstanding DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    frequency INTEGER DEFAULT 0,
    is_recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create client_feedback table
CREATE TABLE client_feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view billing data"
    ON billing FOR SELECT
    USING (true);

CREATE POLICY "Users can view tasks"
    ON tasks FOR SELECT
    USING (true);

CREATE POLICY "Users can view client feedback"
    ON client_feedback FOR SELECT
    USING (true);

-- Create service role bypass policies
CREATE POLICY "Service role can bypass RLS on billing"
    ON billing FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can bypass RLS on tasks"
    ON tasks FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can bypass RLS on client_feedback"
    ON client_feedback FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Grant necessary permissions
GRANT ALL ON billing TO authenticated;
GRANT ALL ON tasks TO authenticated;
GRANT ALL ON client_feedback TO authenticated; 