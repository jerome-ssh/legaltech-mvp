-- Remove redundant fields from professional_ids table
ALTER TABLE professional_ids 
DROP COLUMN IF EXISTS year_issued,
DROP COLUMN IF EXISTS verification_status; 