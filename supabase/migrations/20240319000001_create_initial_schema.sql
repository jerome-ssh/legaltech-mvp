-- Create initial tables
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cases (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    description text,
    client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'on_hold', 'closed')),
    priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date timestamp with time zone,
    assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schedules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_due_date ON cases(due_date);
CREATE INDEX IF NOT EXISTS idx_cases_last_updated ON cases(last_updated_at);
CREATE INDEX IF NOT EXISTS idx_schedules_profile_id ON schedules(profile_id);
CREATE INDEX IF NOT EXISTS idx_schedules_start_time ON schedules(start_time);

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own cases" ON cases;
DROP POLICY IF EXISTS "Users can insert their own cases" ON cases;
DROP POLICY IF EXISTS "Users can update their own cases" ON cases;
DROP POLICY IF EXISTS "Users can view their own schedules" ON schedules;
DROP POLICY IF EXISTS "Users can insert their own schedules" ON schedules;
DROP POLICY IF EXISTS "Users can update their own schedules" ON schedules;

-- Add RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Cases policies
DROP POLICY IF EXISTS "Users can view their own cases" ON cases;
CREATE POLICY "Users can view their own cases"
    ON cases FOR SELECT
    USING (auth.uid() = client_id OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = cases.profile_id 
        AND profiles.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can insert their own cases" ON cases;
CREATE POLICY "Users can insert their own cases"
    ON cases FOR INSERT
    WITH CHECK (auth.uid() = client_id OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = cases.profile_id 
        AND profiles.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can update their own cases" ON cases;
CREATE POLICY "Users can update their own cases"
    ON cases FOR UPDATE
    USING (auth.uid() = client_id OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = cases.profile_id 
        AND profiles.user_id = auth.uid()
    ));

-- Schedules policies
DROP POLICY IF EXISTS "Users can view their own schedules" ON schedules;
CREATE POLICY "Users can view their own schedules"
    ON schedules FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = schedules.profile_id 
        AND profiles.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can insert their own schedules" ON schedules;
CREATE POLICY "Users can insert their own schedules"
    ON schedules FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = schedules.profile_id 
        AND profiles.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can update their own schedules" ON schedules;
CREATE POLICY "Users can update their own schedules"
    ON schedules FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = schedules.profile_id 
        AND profiles.user_id = auth.uid()
    ));

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cases_updated_at ON cases;
CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_schedules_updated_at ON schedules;
CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for cases last_updated_at
CREATE OR REPLACE FUNCTION update_cases_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_cases_last_updated ON cases;
CREATE TRIGGER update_cases_last_updated
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_cases_last_updated(); 