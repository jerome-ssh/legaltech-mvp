-- Create cases table
CREATE TABLE IF NOT EXISTS cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' NOT NULL,
    revenue DECIMAL(10,2) DEFAULT 0,
    expenses DECIMAL(10,2) DEFAULT 0,
    closed_at TIMESTAMP WITH TIME ZONE,
    client_id UUID REFERENCES auth.users(id),
    profile_id UUID REFERENCES profiles(id)
);

-- Create case_types table
CREATE TABLE IF NOT EXISTS case_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    description TEXT
);

-- Create billing table
CREATE TABLE IF NOT EXISTS billing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    month TEXT NOT NULL,
    paid DECIMAL(10,2) NOT NULL,
    outstanding DECIMAL(10,2) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    frequency INTEGER DEFAULT 0,
    is_recurring BOOLEAN DEFAULT false,
    case_id UUID REFERENCES cases(id)
);

-- Create client_feedback table
CREATE TABLE IF NOT EXISTS client_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    case_id UUID REFERENCES cases(id),
    client_id UUID REFERENCES auth.users(id)
);

-- Create RLS policies
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_feedback ENABLE ROW LEVEL SECURITY;

-- Cases policies
DROP POLICY IF EXISTS "Users can view their own cases" ON cases;
CREATE POLICY "Users can view their own cases"
    ON cases FOR SELECT
    USING (match_user_id(client_id, auth.uid()) OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = cases.profile_id 
        AND match_user_id(profiles.user_id, auth.uid())
    ));

DROP POLICY IF EXISTS "Users can insert their own cases" ON cases;
CREATE POLICY "Users can insert their own cases"
    ON cases FOR INSERT
    WITH CHECK (match_user_id(client_id, auth.uid()) OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = cases.profile_id 
        AND match_user_id(profiles.user_id, auth.uid())
    ));

DROP POLICY IF EXISTS "Users can update their own cases" ON cases;
CREATE POLICY "Users can update their own cases"
    ON cases FOR UPDATE
    USING (match_user_id(client_id, auth.uid()) OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = cases.profile_id 
        AND match_user_id(profiles.user_id, auth.uid())
    ));

-- Case types policies
DROP POLICY IF EXISTS "Anyone can view case types" ON case_types;
CREATE POLICY "Anyone can view case types"
    ON case_types FOR SELECT
    USING (true);

-- Billing policies
DROP POLICY IF EXISTS "Users can view billing data" ON billing;
CREATE POLICY "Users can view billing data"
    ON billing FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert billing data" ON billing;
CREATE POLICY "Users can insert billing data"
    ON billing FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update billing data" ON billing;
CREATE POLICY "Users can update billing data"
    ON billing FOR UPDATE
    USING (true);

-- Tasks policies
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
CREATE POLICY "Users can view their own tasks"
    ON tasks FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cases
        WHERE cases.id = tasks.case_id
        AND (match_user_id(cases.client_id, auth.uid()) OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = cases.profile_id 
            AND match_user_id(profiles.user_id, auth.uid())
        ))
    ));

DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
CREATE POLICY "Users can insert their own tasks"
    ON tasks FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM cases
        WHERE cases.id = tasks.case_id
        AND (match_user_id(cases.client_id, auth.uid()) OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = cases.profile_id 
            AND match_user_id(profiles.user_id, auth.uid())
        ))
    ));

DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
CREATE POLICY "Users can update their own tasks"
    ON tasks FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM cases
        WHERE cases.id = tasks.case_id
        AND (match_user_id(cases.client_id, auth.uid()) OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = cases.profile_id 
            AND match_user_id(profiles.user_id, auth.uid())
        ))
    ));

-- Client feedback policies
DROP POLICY IF EXISTS "Users can view their own feedback" ON client_feedback;
CREATE POLICY "Users can view their own feedback"
    ON client_feedback FOR SELECT
    USING (match_user_id(client_id, auth.uid()) OR EXISTS (
        SELECT 1 FROM cases
        WHERE cases.id = client_feedback.case_id
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = cases.profile_id 
            AND match_user_id(profiles.user_id, auth.uid())
        )
    ));

DROP POLICY IF EXISTS "Users can insert their own feedback" ON client_feedback;
CREATE POLICY "Users can insert their own feedback"
    ON client_feedback FOR INSERT
    WITH CHECK (match_user_id(client_id, auth.uid()));

DROP POLICY IF EXISTS "Users can update their own feedback" ON client_feedback;
CREATE POLICY "Users can update their own feedback"
    ON client_feedback FOR UPDATE
    USING (match_user_id(client_id, auth.uid()));

-- Insert some sample data
INSERT INTO case_types (name, description) VALUES
    ('Criminal', 'Criminal law cases'),
    ('Civil', 'Civil law cases'),
    ('Family', 'Family law cases'),
    ('Corporate', 'Corporate law cases'),
    ('Real Estate', 'Real estate law cases');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_cases_updated_at ON cases;
CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 