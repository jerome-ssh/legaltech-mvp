-- Create user_metrics table
CREATE TABLE IF NOT EXISTS user_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_user_metrics_user_id ON user_metrics(user_id);

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

-- Create policy to allow users to read their own metrics
CREATE POLICY "Users can view their own metrics"
    ON user_metrics
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy to allow users to update their own metrics
CREATE POLICY "Users can update their own metrics"
    ON user_metrics
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policy to allow system to insert metrics
CREATE POLICY "System can insert metrics"
    ON user_metrics
    FOR INSERT
    WITH CHECK (true); 