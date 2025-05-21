-- Drop existing enum if it exists
DROP TYPE IF EXISTS role_level CASCADE;

-- Create role_level enum
CREATE TYPE role_level AS ENUM (
    'system',      -- Platform-level roles
    'firm_admin',  -- Firm administration
    'management',  -- Firm management
    'professional', -- Legal professionals
    'support'      -- Support staff
);

-- Create or replace the log_audit_changes function
CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_changed_by UUID;
    v_old_data JSONB;
    v_new_data JSONB;
BEGIN
    -- Get the user ID from auth.uid() as default
    v_changed_by := auth.uid();

    -- Try to get the user ID from the record if available
    BEGIN
        IF TG_OP = 'INSERT' AND NEW.created_by IS NOT NULL THEN
            v_changed_by := NEW.created_by;
        ELSIF TG_OP = 'UPDATE' AND NEW.updated_by IS NOT NULL THEN
            v_changed_by := NEW.updated_by;
        ELSIF TG_OP = 'DELETE' AND OLD.updated_by IS NOT NULL THEN
            v_changed_by := OLD.updated_by;
        END IF;
    EXCEPTION WHEN undefined_column THEN
        -- If the column doesn't exist, just use auth.uid()
        NULL;
    END;

    -- Create JSON data without created_at/updated_at columns
    IF TG_OP = 'INSERT' THEN
        v_new_data := row_to_json(NEW);
        -- Remove created_at and updated_at if they exist
        v_new_data := v_new_data - 'created_at' - 'updated_at';
        
        INSERT INTO audit_log (table_name, record_id, action, changed_by, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'insert', v_changed_by, v_new_data);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        v_old_data := row_to_json(OLD);
        v_new_data := row_to_json(NEW);
        -- Remove created_at and updated_at if they exist
        v_old_data := v_old_data - 'created_at' - 'updated_at';
        v_new_data := v_new_data - 'created_at' - 'updated_at';
        
        INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, 'update', v_changed_by, v_old_data, v_new_data);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        v_old_data := row_to_json(OLD);
        -- Remove created_at and updated_at if they exist
        v_old_data := v_old_data - 'created_at' - 'updated_at';
        
        INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data)
        VALUES (TG_TABLE_NAME, OLD.id, 'delete', v_changed_by, v_old_data);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql; 