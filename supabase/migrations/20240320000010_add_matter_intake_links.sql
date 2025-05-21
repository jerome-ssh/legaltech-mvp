-- Create matter_intake_links table for e-form tokens and status tracking
CREATE TABLE IF NOT EXISTS matter_intake_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matter_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'completed', 'expired')),
    sent_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_matter_intake_links_matter_id ON matter_intake_links(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_intake_links_client_id ON matter_intake_links(client_id);
CREATE INDEX IF NOT EXISTS idx_matter_intake_links_token ON matter_intake_links(token);
CREATE INDEX IF NOT EXISTS idx_matter_intake_links_status ON matter_intake_links(status);

-- Enable Row Level Security
ALTER TABLE matter_intake_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own matter intake links"
    ON matter_intake_links
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = matter_intake_links.matter_id
            AND (cases.client_id = auth.uid() OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = cases.profile_id 
                AND profiles.user_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Users can create matter intake links"
    ON matter_intake_links
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = matter_intake_links.matter_id
            AND (cases.client_id = auth.uid() OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = cases.profile_id 
                AND profiles.user_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Users can update their own matter intake links"
    ON matter_intake_links
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = matter_intake_links.matter_id
            AND (cases.client_id = auth.uid() OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = cases.profile_id 
                AND profiles.user_id = auth.uid()
            ))
        )
    );

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_matter_intake_links_updated_at ON matter_intake_links;
CREATE TRIGGER set_matter_intake_links_updated_at
    BEFORE UPDATE ON matter_intake_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 