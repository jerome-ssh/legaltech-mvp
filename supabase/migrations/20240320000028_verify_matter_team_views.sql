-- Verify matter team views
DO $$
DECLARE
    active_count INTEGER;
    leads_count INTEGER;
    billing_count INTEGER;
    responsible_count INTEGER;
    history_count INTEGER;
BEGIN
    -- Check if views exist
    RAISE NOTICE 'Checking if views exist...';
    
    IF NOT EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'active_matter_team') THEN
        RAISE EXCEPTION 'View active_matter_team does not exist';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'matter_team_leads') THEN
        RAISE EXCEPTION 'View matter_team_leads does not exist';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'matter_billing_attorneys') THEN
        RAISE EXCEPTION 'View matter_billing_attorneys does not exist';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'matter_responsible_attorneys') THEN
        RAISE EXCEPTION 'View matter_responsible_attorneys does not exist';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'matter_team_history') THEN
        RAISE EXCEPTION 'View matter_team_history does not exist';
    END IF;
    
    -- Count records in each view
    SELECT COUNT(*) INTO active_count FROM active_matter_team;
    SELECT COUNT(*) INTO leads_count FROM matter_team_leads;
    SELECT COUNT(*) INTO billing_count FROM matter_billing_attorneys;
    SELECT COUNT(*) INTO responsible_count FROM matter_responsible_attorneys;
    SELECT COUNT(*) INTO history_count FROM matter_team_history;
    
    -- Display counts
    RAISE NOTICE 'Record counts in views:';
    RAISE NOTICE 'active_matter_team: %', active_count;
    RAISE NOTICE 'matter_team_leads: %', leads_count;
    RAISE NOTICE 'matter_billing_attorneys: %', billing_count;
    RAISE NOTICE 'matter_responsible_attorneys: %', responsible_count;
    RAISE NOTICE 'matter_team_history: %', history_count;
    
    -- Verify view structure
    RAISE NOTICE 'Verifying view structure...';
    
    -- Check active_matter_team columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'active_matter_team' 
        AND column_name = 'case_title'
    ) THEN
        RAISE EXCEPTION 'Column case_title missing from active_matter_team';
    END IF;
    
    -- Check matter_team_leads columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matter_team_leads' 
        AND column_name = 'case_title'
    ) THEN
        RAISE EXCEPTION 'Column case_title missing from matter_team_leads';
    END IF;
    
    -- Check matter_billing_attorneys columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matter_billing_attorneys' 
        AND column_name = 'case_title'
    ) THEN
        RAISE EXCEPTION 'Column case_title missing from matter_billing_attorneys';
    END IF;
    
    -- Check matter_responsible_attorneys columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matter_responsible_attorneys' 
        AND column_name = 'case_title'
    ) THEN
        RAISE EXCEPTION 'Column case_title missing from matter_responsible_attorneys';
    END IF;
    
    -- Check matter_team_history columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matter_team_history' 
        AND column_name = 'case_title'
    ) THEN
        RAISE EXCEPTION 'Column case_title missing from matter_team_history';
    END IF;
    
    -- Verify security barrier settings
    RAISE NOTICE 'Verifying security barrier settings...';
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'active_matter_team'
        AND n.nspname = 'public'
        AND c.relkind = 'v'
        AND (
            c.reloptions @> ARRAY['security_barrier=true']
            OR c.reloptions @> ARRAY['security_barrier=on']
        )
    ) THEN
        RAISE EXCEPTION 'Security barrier not enabled on active_matter_team';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'matter_team_leads'
        AND n.nspname = 'public'
        AND c.relkind = 'v'
        AND (
            c.reloptions @> ARRAY['security_barrier=true']
            OR c.reloptions @> ARRAY['security_barrier=on']
        )
    ) THEN
        RAISE EXCEPTION 'Security barrier not enabled on matter_team_leads';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'matter_billing_attorneys'
        AND n.nspname = 'public'
        AND c.relkind = 'v'
        AND (
            c.reloptions @> ARRAY['security_barrier=true']
            OR c.reloptions @> ARRAY['security_barrier=on']
        )
    ) THEN
        RAISE EXCEPTION 'Security barrier not enabled on matter_billing_attorneys';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'matter_responsible_attorneys'
        AND n.nspname = 'public'
        AND c.relkind = 'v'
        AND (
            c.reloptions @> ARRAY['security_barrier=true']
            OR c.reloptions @> ARRAY['security_barrier=on']
        )
    ) THEN
        RAISE EXCEPTION 'Security barrier not enabled on matter_responsible_attorneys';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'matter_team_history'
        AND n.nspname = 'public'
        AND c.relkind = 'v'
        AND (
            c.reloptions @> ARRAY['security_barrier=true']
            OR c.reloptions @> ARRAY['security_barrier=on']
        )
    ) THEN
        RAISE EXCEPTION 'Security barrier not enabled on matter_team_history';
    END IF;
    
    RAISE NOTICE 'All verifications passed successfully!';
END $$;

-- Display sample data from each view
SELECT 'active_matter_team' as view_name, COUNT(*) as record_count FROM active_matter_team
UNION ALL
SELECT 'matter_team_leads', COUNT(*) FROM matter_team_leads
UNION ALL
SELECT 'matter_billing_attorneys', COUNT(*) FROM matter_billing_attorneys
UNION ALL
SELECT 'matter_responsible_attorneys', COUNT(*) FROM matter_responsible_attorneys
UNION ALL
SELECT 'matter_team_history', COUNT(*) FROM matter_team_history;

-- Display a sample record from each view
SELECT 'active_matter_team' as view_name, * FROM active_matter_team LIMIT 1;
SELECT 'matter_team_leads' as view_name, * FROM matter_team_leads LIMIT 1;
SELECT 'matter_billing_attorneys' as view_name, * FROM matter_billing_attorneys LIMIT 1;
SELECT 'matter_responsible_attorneys' as view_name, * FROM matter_responsible_attorneys LIMIT 1;
SELECT 'matter_team_history' as view_name, * FROM matter_team_history LIMIT 1;

-- Simple verification of views and their security settings
SELECT 
    c.relname as view_name,
    c.relkind as type,
    c.reloptions as options,
    pg_get_viewdef(c.oid) as view_definition
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
AND n.nspname = 'public'
AND c.relname IN (
    'active_matter_team',
    'matter_team_leads',
    'matter_billing_attorneys',
    'matter_responsible_attorneys',
    'matter_team_history'
)
ORDER BY c.relname;

-- Check if views are accessible
SELECT 'active_matter_team' as view_name, COUNT(*) as record_count FROM active_matter_team
UNION ALL
SELECT 'matter_team_leads', COUNT(*) FROM matter_team_leads
UNION ALL
SELECT 'matter_billing_attorneys', COUNT(*) FROM matter_billing_attorneys
UNION ALL
SELECT 'matter_responsible_attorneys', COUNT(*) FROM matter_responsible_attorneys
UNION ALL
SELECT 'matter_team_history', COUNT(*) FROM matter_team_history; 