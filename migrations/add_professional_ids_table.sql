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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookups (updated to use profile_id)
CREATE INDEX IF NOT EXISTS idx_professional_ids_profile_id ON professional_ids(profile_id);
CREATE INDEX IF NOT EXISTS idx_professional_ids_country ON professional_ids(country);
CREATE INDEX IF NOT EXISTS idx_professional_ids_state ON professional_ids(state);

-- Remove bar_number from profiles table (if it exists)
ALTER TABLE profiles DROP COLUMN IF EXISTS bar_number; 