-- Add ai_summary column to cases table
ALTER TABLE cases ADD COLUMN IF NOT EXISTS ai_summary TEXT;

-- Add index for better performance when querying by ai_summary
CREATE INDEX IF NOT EXISTS idx_cases_ai_summary ON cases(ai_summary);

-- Add trigger to update updated_at when ai_summary changes
CREATE OR REPLACE FUNCTION update_ai_summary_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ai_summary IS DISTINCT FROM OLD.ai_summary THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cases_ai_summary_timestamp
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_summary_timestamp(); 