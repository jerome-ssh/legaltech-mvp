-- Function to check if a table exists and return its structure
CREATE OR REPLACE FUNCTION verify_table_structure(table_name text)
RETURNS TABLE (
    column_name text,
    data_type text,
    is_nullable text,
    column_default text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::text,
        c.data_type::text,
        c.is_nullable::text,
        c.column_default::text
    FROM information_schema.columns c
    WHERE c.table_name = verify_table_structure.table_name
    AND c.table_schema = 'public';
END;
$$ LANGUAGE plpgsql;

-- Function to check if a trigger exists
CREATE OR REPLACE FUNCTION verify_trigger_exists(trigger_name text, table_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM information_schema.triggers
        WHERE trigger_name = verify_trigger_exists.trigger_name
        AND event_object_table = verify_trigger_exists.table_name
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if a policy exists
CREATE OR REPLACE FUNCTION verify_policy_exists(policy_name text, table_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE policyname = verify_policy_exists.policy_name
        AND tablename = verify_policy_exists.table_name
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if an index exists
CREATE OR REPLACE FUNCTION verify_index_exists(index_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE indexname = verify_index_exists.index_name
    );
END;
$$ LANGUAGE plpgsql;

-- List of tables to verify
DO $$
DECLARE
    tables text[] := ARRAY[
        'documents',
        'document_permissions',
        'profiles',
        'document_versions',
        'document_comments',
        'document_tags',
        'document_tag_relationships',
        'document_categories',
        'document_workflows',
        'document_audit_logs',
        'case_types',
        'cases',
        'billing',
        'tasks',
        'client_feedback'
    ];
    table_name text;
    table_exists boolean;
BEGIN
    RAISE NOTICE 'Verifying database structure...';
    
    -- Check each table
    FOREACH table_name IN ARRAY tables
    LOOP
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_name = table_name
            AND table_schema = 'public'
        ) INTO table_exists;
        
        IF table_exists THEN
            RAISE NOTICE 'Table % exists', table_name;
            -- Show table structure
            RAISE NOTICE 'Structure of %:', table_name;
            FOR r IN SELECT * FROM verify_table_structure(table_name)
            LOOP
                RAISE NOTICE '  Column: %, Type: %, Nullable: %, Default: %',
                    r.column_name, r.data_type, r.is_nullable, r.column_default;
            END LOOP;
        ELSE
            RAISE NOTICE 'Table % is MISSING', table_name;
        END IF;
    END LOOP;
    
    -- Check triggers
    RAISE NOTICE 'Verifying triggers...';
    IF verify_trigger_exists('update_documents_updated_at', 'documents') THEN
        RAISE NOTICE 'Trigger update_documents_updated_at exists on documents';
    ELSE
        RAISE NOTICE 'Trigger update_documents_updated_at is MISSING on documents';
    END IF;
    
    -- Check policies
    RAISE NOTICE 'Verifying policies...';
    IF verify_policy_exists('Users can view their own permissions', 'document_permissions') THEN
        RAISE NOTICE 'Policy "Users can view their own permissions" exists on document_permissions';
    ELSE
        RAISE NOTICE 'Policy "Users can view their own permissions" is MISSING on document_permissions';
    END IF;
    
    -- Check indexes
    RAISE NOTICE 'Verifying indexes...';
    IF verify_index_exists('idx_documents_case_id') THEN
        RAISE NOTICE 'Index idx_documents_case_id exists';
    ELSE
        RAISE NOTICE 'Index idx_documents_case_id is MISSING';
    END IF;
    
    -- Check functions
    RAISE NOTICE 'Verifying functions...';
    IF EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'get_document_history'
    ) THEN
        RAISE NOTICE 'Function get_document_history exists';
    ELSE
        RAISE NOTICE 'Function get_document_history is MISSING';
    END IF;
    
    -- Check case types data
    RAISE NOTICE 'Verifying case types data...';
    IF EXISTS (
        SELECT 1
        FROM case_types
        WHERE name = 'Criminal'
    ) THEN
        RAISE NOTICE 'Default case type "Criminal" exists';
    ELSE
        RAISE NOTICE 'Default case type "Criminal" is MISSING';
    END IF;
    
END $$; 