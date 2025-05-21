-- Enhance law_firms table with additional fields for better firm type handling
DO $$ 
BEGIN
    -- Create firm_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'firm_type') THEN
        CREATE TYPE firm_type AS ENUM ('solo', 'firm');
    END IF;

    -- Create firm_size enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'firm_size') THEN
        CREATE TYPE firm_size AS ENUM ('solo', 'small', 'medium', 'large');
    END IF;
END $$;

-- Add new columns to law_firms table
ALTER TABLE law_firms
    ADD COLUMN IF NOT EXISTS firm_type firm_type NOT NULL DEFAULT 'firm',
    ADD COLUMN IF NOT EXISTS firm_size firm_size NOT NULL DEFAULT 'small',
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_law_firms_firm_type ON law_firms(firm_type);
CREATE INDEX IF NOT EXISTS idx_law_firms_firm_size ON law_firms(firm_size);
CREATE INDEX IF NOT EXISTS idx_law_firms_is_active ON law_firms(is_active);
CREATE INDEX IF NOT EXISTS idx_law_firms_onboarding_completed ON law_firms(onboarding_completed);

-- Add comments for documentation
COMMENT ON COLUMN law_firms.firm_type IS 'Type of firm: solo for individual practitioners, firm for multi-user organizations';
COMMENT ON COLUMN law_firms.firm_size IS 'Size category of the firm: solo, small (2-10), medium (11-50), large (50+)';
COMMENT ON COLUMN law_firms.is_active IS 'Whether the firm is currently active in the system';
COMMENT ON COLUMN law_firms.onboarding_completed IS 'Whether the firm has completed the onboarding process';
COMMENT ON COLUMN law_firms.metadata IS 'Additional firm-specific metadata stored as JSON';

-- Update RLS policies to consider new fields
DROP POLICY IF EXISTS "Law firms are viewable by all authenticated users" ON law_firms;
CREATE POLICY "Law firms are viewable by all authenticated users" 
    ON law_firms FOR SELECT 
    USING (
        auth.role() = 'authenticated' 
        AND (is_active = true OR auth.uid() IN (
            SELECT user_id FROM law_firm_associations 
            WHERE law_firm_id = law_firms.id
        ))
    );

-- Add function to automatically set firm_size based on user count
CREATE OR REPLACE FUNCTION update_firm_size()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Count active users in the firm
    SELECT COUNT(*) INTO user_count
    FROM law_firm_associations
    WHERE law_firm_id = NEW.id
    AND status = 'active';

    -- Update firm_size based on user count
    NEW.firm_size := CASE
        WHEN user_count = 1 THEN 'solo'::firm_size
        WHEN user_count <= 10 THEN 'small'::firm_size
        WHEN user_count <= 50 THEN 'medium'::firm_size
        ELSE 'large'::firm_size
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update firm_size
DROP TRIGGER IF EXISTS update_firm_size_trigger ON law_firms;
CREATE TRIGGER update_firm_size_trigger
    BEFORE INSERT OR UPDATE ON law_firms
    FOR EACH ROW
    EXECUTE FUNCTION update_firm_size(); 