-- Add new columns to cases table
ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'on_hold', 'closed')),
    ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    ADD COLUMN IF NOT EXISTS due_date timestamp with time zone,
    ADD COLUMN IF NOT EXISTS last_updated_at timestamp with time zone DEFAULT now();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_due_date ON cases(due_date);
CREATE INDEX IF NOT EXISTS idx_cases_last_updated ON cases(last_updated_at);

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

-- Add comment to explain the status values
COMMENT ON COLUMN cases.status IS 'Current status of the case: open, in_progress, on_hold, or closed';

-- Add comment to explain the priority values
COMMENT ON COLUMN cases.priority IS 'Priority level of the case: low, medium, high, or urgent';

-- Add comment to explain the due_date
COMMENT ON COLUMN cases.due_date IS 'Expected completion date for the case';

-- Add comment to explain the last_updated_at
COMMENT ON COLUMN cases.last_updated_at IS 'Timestamp of the last update to the case record'; 