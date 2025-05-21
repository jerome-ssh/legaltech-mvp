-- Update clients table structure
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS profile_id UUID,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'English',
ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'Individual';

-- Add foreign key constraint for profile_id
ALTER TABLE clients
ADD CONSTRAINT fk_clients_profile
FOREIGN KEY (profile_id) REFERENCES profiles(id);

-- Create index for profile_id
CREATE INDEX IF NOT EXISTS idx_clients_profile_id ON clients(profile_id);

-- Update existing records to split name into first_name and last_name
UPDATE clients
SET 
    first_name = SPLIT_PART(name, ' ', 1),
    last_name = SUBSTRING(name FROM POSITION(' ' IN name) + 1)
WHERE first_name IS NULL AND last_name IS NULL;

-- Make name column nullable since we now have first_name and last_name
ALTER TABLE clients
ALTER COLUMN name DROP NOT NULL; 