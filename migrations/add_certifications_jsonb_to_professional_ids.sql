-- Add certifications JSONB field to professional_ids table to store multiple certifications per user
ALTER TABLE professional_ids
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN professional_ids.certifications IS 'Array of certification objects with fields: id, name, country, state, issuing_authority, issue_date, document_url, document_name'; 