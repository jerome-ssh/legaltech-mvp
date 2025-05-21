-- Verify matter_team table structure
DO $$
DECLARE
    v_index_exists boolean;
    v_policy_exists boolean;
    v_trigger_exists boolean;
BEGIN
    -- Check if table exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'matter_team'
    ) THEN
        RAISE EXCEPTION 'matter_team table does not exist';
    END IF;

    -- Check if partial unique indexes exist
    SELECT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'matter_team' 
        AND indexname = 'unique_matter_lead'
    ) INTO v_index_exists;
    
    IF NOT v_index_exists THEN
        RAISE EXCEPTION 'unique_matter_lead index is missing';
    END IF;

    SELECT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'matter_team' 
        AND indexname = 'unique_billing_attorney'
    ) INTO v_index_exists;
    
    IF NOT v_index_exists THEN
        RAISE EXCEPTION 'unique_billing_attorney index is missing';
    END IF;

    SELECT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'matter_team' 
        AND indexname = 'unique_responsible_attorney'
    ) INTO v_index_exists;
    
    IF NOT v_index_exists THEN
        RAISE EXCEPTION 'unique_responsible_attorney index is missing';
    END IF;

    -- Check if RLS policies exist
    SELECT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'matter_team' 
        AND policyname = 'Users can view matter team members'
    ) INTO v_policy_exists;
    
    IF NOT v_policy_exists THEN
        RAISE EXCEPTION 'View policy is missing';
    END IF;

    -- Check if triggers exist
    SELECT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'set_matter_team_updated_at'
    ) INTO v_trigger_exists;
    
    IF NOT v_trigger_exists THEN
        RAISE EXCEPTION 'Updated at trigger is missing';
    END IF;

    SELECT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'audit_matter_team'
    ) INTO v_trigger_exists;
    
    IF NOT v_trigger_exists THEN
        RAISE EXCEPTION 'Audit trigger is missing';
    END IF;

    RAISE NOTICE 'All verifications passed successfully';
END $$; 