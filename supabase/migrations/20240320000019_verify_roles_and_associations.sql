-- Verify roles table structure and data
DO $$
DECLARE
    v_count INTEGER;
    v_system_roles INTEGER;
    v_firm_roles INTEGER;
    v_hierarchy_count INTEGER;
BEGIN
    -- Check if all required columns exist
    RAISE NOTICE 'Checking roles table structure...';
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'roles' 
        AND column_name = 'role_level'
    ) THEN
        RAISE EXCEPTION 'role_level column is missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'roles' 
        AND column_name = 'is_firm_specific'
    ) THEN
        RAISE EXCEPTION 'is_firm_specific column is missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'roles' 
        AND column_name = 'permissions'
    ) THEN
        RAISE EXCEPTION 'permissions column is missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'roles' 
        AND column_name = 'parent_role_id'
    ) THEN
        RAISE EXCEPTION 'parent_role_id column is missing';
    END IF;

    -- Count system roles
    SELECT COUNT(*) INTO v_system_roles
    FROM roles
    WHERE role_level = 'system';

    IF v_system_roles < 2 THEN
        RAISE EXCEPTION 'Missing system roles. Expected at least 2, found %', v_system_roles;
    END IF;

    -- Count firm roles
    SELECT COUNT(*) INTO v_firm_roles
    FROM roles
    WHERE is_firm_specific = true;

    IF v_firm_roles < 7 THEN
        RAISE EXCEPTION 'Missing firm roles. Expected at least 7, found %', v_firm_roles;
    END IF;

    -- Verify role hierarchy
    SELECT COUNT(*) INTO v_hierarchy_count
    FROM roles
    WHERE parent_role_id IS NOT NULL;

    IF v_hierarchy_count < 6 THEN
        RAISE EXCEPTION 'Missing role hierarchy relationships. Expected at least 6, found %', v_hierarchy_count;
    END IF;

    -- Verify permissions structure
    IF EXISTS (
        SELECT 1
        FROM roles
        WHERE permissions IS NULL
        OR jsonb_typeof(permissions) != 'object'
    ) THEN
        RAISE EXCEPTION 'Invalid permissions structure found';
    END IF;

    RAISE NOTICE 'Roles table verification completed successfully';
END $$;

-- Verify law_firm_associations table structure and constraints
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Check if all required columns exist
    RAISE NOTICE 'Checking law_firm_associations table structure...';
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'law_firm_associations' 
        AND column_name = 'profile_id'
    ) THEN
        RAISE EXCEPTION 'profile_id column is missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'law_firm_associations' 
        AND column_name = 'law_firm_id'
    ) THEN
        RAISE EXCEPTION 'law_firm_id column is missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'law_firm_associations' 
        AND column_name = 'role_id'
    ) THEN
        RAISE EXCEPTION 'role_id column is missing';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'law_firm_associations' 
        AND column_name = 'status'
    ) THEN
        RAISE EXCEPTION 'status column is missing';
    END IF;

    -- Verify foreign key constraints
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'law_firm_associations'
        AND constraint_name = 'law_firm_associations_profile_id_fkey'
    ) THEN
        RAISE EXCEPTION 'Missing foreign key constraint on profile_id';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'law_firm_associations'
        AND constraint_name = 'law_firm_associations_law_firm_id_fkey'
    ) THEN
        RAISE EXCEPTION 'Missing foreign key constraint on law_firm_id';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'law_firm_associations'
        AND constraint_name = 'law_firm_associations_role_id_fkey'
    ) THEN
        RAISE EXCEPTION 'Missing foreign key constraint on role_id';
    END IF;

    -- Verify unique constraint
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'law_firm_associations'
        AND constraint_name = 'law_firm_associations_profile_id_law_firm_id_key'
    ) THEN
        RAISE EXCEPTION 'Missing unique constraint on (profile_id, law_firm_id)';
    END IF;

    -- Verify status check constraint
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'law_firm_associations'
        AND constraint_name = 'law_firm_associations_status_check'
    ) THEN
        RAISE EXCEPTION 'Missing status check constraint';
    END IF;

    -- Verify RLS is enabled
    IF NOT EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE tablename = 'law_firm_associations'
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'Row Level Security is not enabled';
    END IF;

    -- Verify RLS policies
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'law_firm_associations'
        AND policyname = 'Users can view their own firm associations'
    ) THEN
        RAISE EXCEPTION 'Missing RLS policy for viewing own firm associations';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'law_firm_associations'
        AND policyname = 'Users can manage their own firm associations'
    ) THEN
        RAISE EXCEPTION 'Missing RLS policy for managing own firm associations';
    END IF;

    RAISE NOTICE 'Law firm associations table verification completed successfully';
END $$;

-- Display current roles and their hierarchy
SELECT 
    r.name,
    r.role_level,
    r.is_firm_specific,
    p.name as parent_role,
    r.permissions
FROM roles r
LEFT JOIN roles p ON r.parent_role_id = p.id
ORDER BY r.role_level, r.name;

-- Display current law firm associations structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'law_firm_associations'
ORDER BY ordinal_position; 