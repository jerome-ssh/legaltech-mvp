-- Drop existing table if it exists (to avoid foreign key issues)
DROP TABLE IF EXISTS professional_ids;

-- Create professional_ids table (now referencing profiles)
CREATE TABLE IF NOT EXISTS professional_ids (
    id BIGSERIAL PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    country VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    professional_id VARCHAR(50),
    year_issued INT,
    verification_status VARCHAR(20) DEFAULT 'not_verified', -- e.g., 'verified', 'pending', 'not_verified'
    no_id BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    document_url TEXT,
    document_name VARCHAR(255),
    issuing_authority VARCHAR(255),
    issue_date DATE,
    expiration_date DATE,
    status VARCHAR(20) DEFAULT 'active', -- e.g., 'active', 'inactive', 'suspended', 'revoked'
    verification_notes TEXT,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id),
    CONSTRAINT valid_year_issued CHECK (year_issued >= 1900 AND year_issued <= EXTRACT(YEAR FROM CURRENT_DATE)),
    CONSTRAINT valid_dates CHECK (
        (issue_date IS NULL OR issue_date <= CURRENT_DATE) AND
        (expiration_date IS NULL OR expiration_date >= CURRENT_DATE)
    )
);

-- Indexes for fast lookups (updated to use profile_id)
CREATE INDEX IF NOT EXISTS idx_professional_ids_profile_id ON professional_ids(profile_id);
CREATE INDEX IF NOT EXISTS idx_professional_ids_country ON professional_ids(country);
CREATE INDEX IF NOT EXISTS idx_professional_ids_state ON professional_ids(state);
CREATE INDEX IF NOT EXISTS idx_professional_ids_status ON professional_ids(status);
CREATE INDEX IF NOT EXISTS idx_professional_ids_verification ON professional_ids(verification_status);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_professional_ids_updated_at
    BEFORE UPDATE ON professional_ids
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Remove bar_number from profiles table (if it exists)
ALTER TABLE profiles DROP COLUMN IF EXISTS bar_number; 