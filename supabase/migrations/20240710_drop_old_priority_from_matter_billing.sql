-- Drop the old priority column from matter_billing
ALTER TABLE matter_billing DROP COLUMN IF EXISTS priority; 