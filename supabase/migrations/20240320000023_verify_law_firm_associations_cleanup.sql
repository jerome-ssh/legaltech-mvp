-- Verify law_firm_associations table structure
DO $$
DECLARE
    v_column_exists boolean;
    v_constraint_exists boolean;
BEGIN
    -- Check if old role column is gone
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'law_firm_associations' 
        AND column_name = 'role'
    ) INTO v_column_exists;
    
    IF v_column_exists THEN
        RAISE EXCEPTION 'Old role column still exists';
    END IF;

    -- Check if role_id is NOT NULL
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'law_firm_associations' 
        AND column_name = 'role_id'
        AND is_nullable = 'NO'
    ) INTO v_constraint_exists;
    
    IF NOT v_constraint_exists THEN
        RAISE EXCEPTION 'role_id column is not NOT NULL';
    END IF;

    -- Check if foreign key constraint exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'law_firm_associations' 
        AND constraint_name = 'law_firm_associations_role_id_fkey'
    ) INTO v_constraint_exists;
    
    IF NOT v_constraint_exists THEN
        RAISE EXCEPTION 'Foreign key constraint on role_id is missing';
    END IF;

    -- Check if all associations have valid role_ids
    IF EXISTS (
        SELECT 1 
        FROM law_firm_associations lfa
        LEFT JOIN roles r ON lfa.role_id = r.id
        WHERE r.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Found associations with invalid role_ids';
    END IF;

    RAISE NOTICE 'All verifications passed successfully';
END $$; 