-- Add enhanced fields to professional_ids table to make certification management more comprehensive
ALTER TABLE professional_ids
ADD COLUMN IF NOT EXISTS issuing_authority VARCHAR(255),
ADD COLUMN IF NOT EXISTS issue_date DATE; 