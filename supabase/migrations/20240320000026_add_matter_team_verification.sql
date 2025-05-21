-- Comprehensive verification of matter_team table
DO $$
DECLARE
    v_count integer;
    v_invalid_count integer;
BEGIN
    -- 1. Verify foreign key constraints
    -- Check for invalid matter_id references
    SELECT COUNT(*) INTO v_invalid_count
    FROM matter_team mt
    LEFT JOIN cases c ON mt.matter_id = c.id
    WHERE c.id IS NULL;

    IF v_invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % invalid matter_id references', v_invalid_count;
    END IF;

    -- Check for invalid profile_id references
    SELECT COUNT(*) INTO v_invalid_count
    FROM matter_team mt
    LEFT JOIN profiles p ON mt.profile_id = p.id
    WHERE p.id IS NULL;

    IF v_invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % invalid profile_id references', v_invalid_count;
    END IF;

    -- Check for invalid role_id references
    SELECT COUNT(*) INTO v_invalid_count
    FROM matter_team mt
    LEFT JOIN roles r ON mt.role_id = r.id
    WHERE r.id IS NULL;

    IF v_invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % invalid role_id references', v_invalid_count;
    END IF;

    -- 2. Verify unique constraints
    -- Check for multiple leads on the same matter
    SELECT COUNT(*) INTO v_invalid_count
    FROM (
        SELECT matter_id, COUNT(*) as lead_count
        FROM matter_team
        WHERE is_lead = true
        GROUP BY matter_id
        HAVING COUNT(*) > 1
    ) as leads;

    IF v_invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % matters with multiple leads', v_invalid_count;
    END IF;

    -- Check for multiple billing attorneys on the same matter
    SELECT COUNT(*) INTO v_invalid_count
    FROM (
        SELECT matter_id, COUNT(*) as billing_count
        FROM matter_team
        WHERE is_billing_attorney = true
        GROUP BY matter_id
        HAVING COUNT(*) > 1
    ) as billing;

    IF v_invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % matters with multiple billing attorneys', v_invalid_count;
    END IF;

    -- Check for multiple responsible attorneys on the same matter
    SELECT COUNT(*) INTO v_invalid_count
    FROM (
        SELECT matter_id, COUNT(*) as responsible_count
        FROM matter_team
        WHERE is_responsible_attorney = true
        GROUP BY matter_id
        HAVING COUNT(*) > 1
    ) as responsible;

    IF v_invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % matters with multiple responsible attorneys', v_invalid_count;
    END IF;

    -- 3. Verify status values
    SELECT COUNT(*) INTO v_invalid_count
    FROM matter_team
    WHERE status NOT IN ('active', 'inactive', 'pending');

    IF v_invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % records with invalid status values', v_invalid_count;
    END IF;

    -- 4. Verify date ranges
    SELECT COUNT(*) INTO v_invalid_count
    FROM matter_team
    WHERE end_date IS NOT NULL AND end_date < start_date;

    IF v_invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % records with invalid date ranges', v_invalid_count;
    END IF;

    -- 5. Verify audit fields
    SELECT COUNT(*) INTO v_invalid_count
    FROM matter_team
    WHERE created_at IS NULL OR updated_at IS NULL;

    IF v_invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % records with missing audit timestamps', v_invalid_count;
    END IF;

    -- 6. Verify RLS policies
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'matter_team'
        AND policyname = 'Users can view matter team members'
    ) THEN
        RAISE EXCEPTION 'Missing view policy';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'matter_team'
        AND policyname = 'Users can create matter team members'
    ) THEN
        RAISE EXCEPTION 'Missing create policy';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'matter_team'
        AND policyname = 'Users can update matter team members'
    ) THEN
        RAISE EXCEPTION 'Missing update policy';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'matter_team'
        AND policyname = 'Users can delete matter team members'
    ) THEN
        RAISE EXCEPTION 'Missing delete policy';
    END IF;

    -- 7. Verify triggers
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'set_matter_team_updated_at'
    ) THEN
        RAISE EXCEPTION 'Missing updated_at trigger';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'audit_matter_team'
    ) THEN
        RAISE EXCEPTION 'Missing audit trigger';
    END IF;

    -- Get total count of records
    SELECT COUNT(*) INTO v_count FROM matter_team;

    RAISE NOTICE 'Verification completed successfully. Found % valid records.', v_count;
END $$; 