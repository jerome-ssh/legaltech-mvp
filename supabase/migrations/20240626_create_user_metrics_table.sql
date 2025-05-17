-- Drop the table if it exists to ensure clean state
DROP TABLE IF EXISTS user_metrics;

-- Create user_metrics table with correct structure
CREATE TABLE user_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    profile_completion INTEGER DEFAULT 0,
    productivity_score INTEGER DEFAULT 0,
    client_feedback DECIMAL(3,1) DEFAULT 0,
    time_saved INTEGER DEFAULT 0,
    ai_interactions INTEGER DEFAULT 0,
    networking_score INTEGER DEFAULT 0,
    compliance_score INTEGER DEFAULT 0,
    billing_efficiency INTEGER DEFAULT 0,
    workflow_efficiency INTEGER DEFAULT 0,
    learning_progress INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on profile_id
CREATE INDEX IF NOT EXISTS idx_user_metrics_profile_id ON user_metrics(profile_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_metrics_updated_at
    BEFORE UPDATE ON user_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_metrics ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view their own metrics" ON user_metrics;
DROP POLICY IF EXISTS "Users can update their own metrics" ON user_metrics;
DROP POLICY IF EXISTS "Users can insert their own metrics" ON user_metrics;
DROP POLICY IF EXISTS "Users can delete their own metrics" ON user_metrics;
DROP POLICY IF EXISTS "System can insert metrics" ON user_metrics;
DROP POLICY IF EXISTS "Allow all operations for testing" ON user_metrics;

-- Create a simple policy that allows all operations for testing
CREATE POLICY "Allow all operations for testing"
    ON user_metrics
    FOR ALL
    USING (true)
    WITH CHECK (true); 