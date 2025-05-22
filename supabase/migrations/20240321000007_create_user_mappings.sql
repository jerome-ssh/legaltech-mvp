-- Create user_mappings table
CREATE TABLE IF NOT EXISTS user_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    supabase_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_mappings_clerk_user_id ON user_mappings(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_mappings_supabase_user_id ON user_mappings(supabase_user_id);

-- Enable RLS
ALTER TABLE user_mappings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own mapping"
    ON user_mappings FOR SELECT
    USING (clerk_user_id = auth.jwt()->>'sub');

CREATE POLICY "Users can update their own mapping"
    ON user_mappings FOR UPDATE
    USING (clerk_user_id = auth.jwt()->>'sub');

-- Create trigger for updated_at
CREATE TRIGGER update_user_mappings_updated_at
    BEFORE UPDATE ON user_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 