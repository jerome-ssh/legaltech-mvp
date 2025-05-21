-- Drop existing function
DROP FUNCTION IF EXISTS log_audit_changes();

-- Create or replace the audit log trigger function
CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_changed_by UUID;
    v_old_data JSONB;
    v_new_data JSONB;
    v_id_type text;
    v_record_id uuid;
BEGIN
    -- Check if we're already in an audit log trigger to prevent recursion
    IF TG_TABLE_NAME = 'audit_log' THEN
        RETURN NEW;
    END IF;

    -- Get the current user ID
    v_changed_by := auth.uid();
    
    -- Get the data type of the id column
    SELECT data_type INTO v_id_type
    FROM information_schema.columns
    WHERE table_name = TG_TABLE_NAME
    AND column_name = 'id';

    -- Convert NEW and OLD records to JSONB
    IF TG_OP = 'INSERT' THEN
        v_new_data := to_jsonb(NEW);
        v_old_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        v_new_data := to_jsonb(NEW);
        v_old_data := to_jsonb(OLD);
    ELSIF TG_OP = 'DELETE' THEN
        v_new_data := NULL;
        v_old_data := to_jsonb(OLD);
    END IF;

    -- Convert record_id to UUID based on column type
    IF TG_OP = 'DELETE' THEN
        IF v_id_type = 'uuid' THEN
            v_record_id := OLD.id;
        ELSE
            -- For non-UUID IDs, generate a deterministic UUID based on the ID
            v_record_id := uuid_generate_v5(uuid_ns_url(), OLD.id::text);
        END IF;
    ELSE
        IF v_id_type = 'uuid' THEN
            v_record_id := NEW.id;
        ELSE
            -- For non-UUID IDs, generate a deterministic UUID based on the ID
            v_record_id := uuid_generate_v5(uuid_ns_url(), NEW.id::text);
        END IF;
    END IF;

    -- Insert into audit_log
    INSERT INTO audit_log (
        table_name,
        record_id,
        action,
        changed_by,
        old_data,
        new_data
    ) VALUES (
        TG_TABLE_NAME,
        v_record_id,
        TG_OP,
        v_changed_by,
        v_old_data,
        v_new_data
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate all the triggers with the new function
DROP TRIGGER IF EXISTS audit_profiles ON profiles;
CREATE TRIGGER audit_profiles
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

DROP TRIGGER IF EXISTS audit_professional_ids ON professional_ids;
CREATE TRIGGER audit_professional_ids
    AFTER INSERT OR UPDATE OR DELETE ON professional_ids
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes(); 