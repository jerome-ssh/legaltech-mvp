-- Add foreign key constraint for assigned_to in matters table
ALTER TABLE matters
ADD CONSTRAINT matters_assigned_to_fkey
FOREIGN KEY (assigned_to)
REFERENCES profiles(id)
ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_matters_assigned_to ON matters(assigned_to);

-- Add comment to explain the relationship
COMMENT ON CONSTRAINT matters_assigned_to_fkey ON matters IS 'Links the assigned attorney (profile) to the matter'; 