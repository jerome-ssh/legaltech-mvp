-- Add priority_id to matters and matter_billing tables
ALTER TABLE matters ADD COLUMN IF NOT EXISTS priority_id uuid REFERENCES priorities(id);
ALTER TABLE matter_billing ADD COLUMN IF NOT EXISTS priority_id uuid REFERENCES priorities(id);
-- Optionally, you can drop the old priority field if you want:
-- ALTER TABLE matters DROP COLUMN IF EXISTS priority;
-- ALTER TABLE matter_billing DROP COLUMN IF EXISTS priority; 