-- Add audit fields to roles table
ALTER TABLE roles
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Create indexes for audit fields
CREATE INDEX IF NOT EXISTS idx_roles_created_by ON roles(created_by);
CREATE INDEX IF NOT EXISTS idx_roles_updated_by ON roles(updated_by);

-- Update existing roles to set created_by and updated_by to NULL
UPDATE roles
SET created_by = NULL,
    updated_by = NULL
WHERE created_by IS NULL; 