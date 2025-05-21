-- Drop existing table to avoid conflicts
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table with correct schema
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    clerk_id TEXT UNIQUE,
    email TEXT,
    phone_number TEXT,
    first_name TEXT,
    last_name TEXT,
    firm_name TEXT,
    specialization TEXT,
    years_of_practice INTEGER,
    avatar_url TEXT,
    address TEXT,
    home_address TEXT,
    gender TEXT,
    role_id UUID REFERENCES roles(id),
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_id ON profiles(clerk_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON profiles(role_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (clerk_id = auth.jwt()->>'sub');

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (clerk_id = auth.jwt()->>'sub');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 