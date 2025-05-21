-- First, ensure all existing associations have a valid role_id
DO $$
DECLARE
    v_default_role_id UUID;
BEGIN
    -- Get the default role ID (associate)
    SELECT id INTO v_default_role_id
    FROM roles
    WHERE name = 'associate'
    LIMIT 1;

    -- Update any null role_ids with the default role
    UPDATE law_firm_associations
    SET role_id = v_default_role_id
    WHERE role_id IS NULL;

    -- Map old role values to new role_ids
    UPDATE law_firm_associations lfa
    SET role_id = r.id
    FROM roles r
    WHERE lfa.role = r.name
    AND lfa.role_id IS NULL;
END $$;

-- Add NOT NULL constraint to role_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'law_firm_associations'
        AND constraint_name = 'law_firm_associations_role_id_not_null'
    ) THEN
        ALTER TABLE law_firm_associations
        ALTER COLUMN role_id SET NOT NULL;
    END IF;
END $$;

-- Drop the old role column
ALTER TABLE law_firm_associations
DROP COLUMN IF EXISTS role;

-- Add a comment to explain the role_id column
COMMENT ON COLUMN law_firm_associations.role_id IS 'References the roles table for standardized role management';

-- Verify the foreign key constraint exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'law_firm_associations'
        AND constraint_name = 'law_firm_associations_role_id_fkey'
    ) THEN
        ALTER TABLE law_firm_associations
        ADD CONSTRAINT law_firm_associations_role_id_fkey
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE RESTRICT;
    END IF;
END $$; 