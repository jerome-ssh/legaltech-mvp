-- Create matter_status table for richer status tracking
CREATE TABLE IF NOT EXISTS matter_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matter_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN (
        'draft',
        'intake_pending',
        'intake_completed',
        'pending_approval',
        'active',
        'on_hold',
        'pending_client',
        'pending_court',
        'pending_opposing_counsel',
        'closed',
        'archived'
    )),
    previous_status TEXT,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_matter_status_matter_id ON matter_status(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_status_status ON matter_status(status);
CREATE INDEX IF NOT EXISTS idx_matter_status_changed_at ON matter_status(changed_at);

-- Enable Row Level Security
ALTER TABLE matter_status ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view matter status history"
    ON matter_status
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM case_participants WHERE case_id = matter_id
        )
    );

CREATE POLICY "Users can create matter status entries"
    ON matter_status
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM case_participants WHERE case_id = matter_id
        )
    );

-- Add trigger for updated_at
CREATE TRIGGER set_matter_status_updated_at
    BEFORE UPDATE ON matter_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to update cases.status when matter_status changes
CREATE OR REPLACE FUNCTION update_case_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE cases
    SET status = NEW.status
    WHERE id = NEW.matter_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_case_status_on_matter_status_change
    AFTER INSERT ON matter_status
    FOR EACH ROW
    EXECUTE FUNCTION update_case_status(); 