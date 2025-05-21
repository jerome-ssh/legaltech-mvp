-- First, drop all audit triggers
DROP TRIGGER IF EXISTS audit_matter_intake_links ON matter_intake_links;
DROP TRIGGER IF EXISTS audit_matter_status ON matter_status;
DROP TRIGGER IF EXISTS audit_matter_billing ON matter_billing;
DROP TRIGGER IF EXISTS audit_activity ON activity;
DROP TRIGGER IF EXISTS audit_activity_logs ON activity_logs;
DROP TRIGGER IF EXISTS audit_ai_interactions ON ai_interactions;
DROP TRIGGER IF EXISTS audit_ai_tasks ON ai_tasks;
DROP TRIGGER IF EXISTS audit_analytics ON analytics;
DROP TRIGGER IF EXISTS audit_audit_log ON audit_log;
DROP TRIGGER IF EXISTS audit_billing ON billing;
DROP TRIGGER IF EXISTS audit_calendar_events ON calendar_events;
DROP TRIGGER IF EXISTS audit_case_documents ON case_documents;
DROP TRIGGER IF EXISTS audit_case_participants ON case_participants;
DROP TRIGGER IF EXISTS audit_case_stages ON case_stages;
DROP TRIGGER IF EXISTS audit_case_team_members ON case_team_members;
DROP TRIGGER IF EXISTS audit_case_types ON case_types;
DROP TRIGGER IF EXISTS audit_cases ON cases;
DROP TRIGGER IF EXISTS audit_client_feedback ON client_feedback;
DROP TRIGGER IF EXISTS audit_clients ON clients;
DROP TRIGGER IF EXISTS audit_connections ON connections;
DROP TRIGGER IF EXISTS audit_deadlines ON deadlines;
DROP TRIGGER IF EXISTS audit_document_audit_logs ON document_audit_logs;
DROP TRIGGER IF EXISTS audit_document_categories ON document_categories;
DROP TRIGGER IF EXISTS audit_document_comments ON document_comments;
DROP TRIGGER IF EXISTS audit_document_permissions ON document_permissions;
DROP TRIGGER IF EXISTS audit_document_tags ON document_tags;
DROP TRIGGER IF EXISTS audit_document_versions ON document_versions;
DROP TRIGGER IF EXISTS audit_document_workflows ON document_workflows;
DROP TRIGGER IF EXISTS audit_documents ON documents;
DROP TRIGGER IF EXISTS audit_firm_invitations ON firm_invitations;
DROP TRIGGER IF EXISTS audit_firm_locations ON firm_locations;
DROP TRIGGER IF EXISTS audit_firm_practice_areas ON firm_practice_areas;
DROP TRIGGER IF EXISTS audit_firm_users ON firm_users;
DROP TRIGGER IF EXISTS audit_firms ON firms;
DROP TRIGGER IF EXISTS audit_invoices ON invoices;
DROP TRIGGER IF EXISTS audit_jurisdictions ON jurisdictions;
DROP TRIGGER IF EXISTS audit_law_firms ON law_firms;
DROP TRIGGER IF EXISTS audit_leads ON leads;
DROP TRIGGER IF EXISTS audit_messages ON messages;
DROP TRIGGER IF EXISTS audit_notes ON notes;
DROP TRIGGER IF EXISTS audit_onboarding_audit_logs ON onboarding_audit_logs;
DROP TRIGGER IF EXISTS audit_practice_areas ON practice_areas;
DROP TRIGGER IF EXISTS audit_priorities ON priorities;
DROP TRIGGER IF EXISTS audit_professional_ids ON professional_ids;
DROP TRIGGER IF EXISTS audit_profiles ON profiles;
DROP TRIGGER IF EXISTS audit_roles ON roles;
DROP TRIGGER IF EXISTS audit_schedules ON schedules;
DROP TRIGGER IF EXISTS audit_teams ON teams;
DROP TRIGGER IF EXISTS audit_time_entries ON time_entries;
DROP TRIGGER IF EXISTS audit_user_activities ON user_activities;
DROP TRIGGER IF EXISTS audit_user_metrics ON user_metrics;
DROP TRIGGER IF EXISTS audit_users ON users;
DROP TRIGGER IF EXISTS audit_workflow_optimizations ON workflow_optimizations;
DROP TRIGGER IF EXISTS audit_document_tag_relationships ON document_tag_relationships;
DROP TRIGGER IF EXISTS audit_tasks ON tasks;
DROP TRIGGER IF EXISTS audit_law_firm_associations ON law_firm_associations;

-- Now we can safely drop and recreate the function
DROP FUNCTION IF EXISTS log_audit_changes();

-- Create the fixed function with recursion prevention
CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_changed_by UUID;
    v_new_data JSONB;
    v_old_data JSONB;
BEGIN
    -- Check if we're already in an audit log trigger to prevent recursion
    IF TG_TABLE_NAME = 'audit_log' THEN
        RETURN NEW;
    END IF;

    -- Get the current user ID
    v_changed_by := auth.uid();
    
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
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        TG_OP,
        v_changed_by,
        v_old_data,
        v_new_data
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate all the triggers with the new function
CREATE TRIGGER audit_matter_intake_links
    AFTER INSERT OR UPDATE OR DELETE ON matter_intake_links
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_matter_status
    AFTER INSERT OR UPDATE OR DELETE ON matter_status
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_matter_billing
    AFTER INSERT OR UPDATE OR DELETE ON matter_billing
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_activity
    AFTER INSERT OR UPDATE OR DELETE ON activity
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_activity_logs
    AFTER INSERT OR UPDATE OR DELETE ON activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_ai_interactions
    AFTER INSERT OR UPDATE OR DELETE ON ai_interactions
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_ai_tasks
    AFTER INSERT OR UPDATE OR DELETE ON ai_tasks
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_analytics
    AFTER INSERT OR UPDATE OR DELETE ON analytics
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_billing
    AFTER INSERT OR UPDATE OR DELETE ON billing
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_calendar_events
    AFTER INSERT OR UPDATE OR DELETE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_case_documents
    AFTER INSERT OR UPDATE OR DELETE ON case_documents
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_case_participants
    AFTER INSERT OR UPDATE OR DELETE ON case_participants
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_case_stages
    AFTER INSERT OR UPDATE OR DELETE ON case_stages
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_case_team_members
    AFTER INSERT OR UPDATE OR DELETE ON case_team_members
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_case_types
    AFTER INSERT OR UPDATE OR DELETE ON case_types
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_cases
    AFTER INSERT OR UPDATE OR DELETE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_client_feedback
    AFTER INSERT OR UPDATE OR DELETE ON client_feedback
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_clients
    AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_connections
    AFTER INSERT OR UPDATE OR DELETE ON connections
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_deadlines
    AFTER INSERT OR UPDATE OR DELETE ON deadlines
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_document_audit_logs
    AFTER INSERT OR UPDATE OR DELETE ON document_audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_document_categories
    AFTER INSERT OR UPDATE OR DELETE ON document_categories
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_document_comments
    AFTER INSERT OR UPDATE OR DELETE ON document_comments
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_document_permissions
    AFTER INSERT OR UPDATE OR DELETE ON document_permissions
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_document_tags
    AFTER INSERT OR UPDATE OR DELETE ON document_tags
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_document_versions
    AFTER INSERT OR UPDATE OR DELETE ON document_versions
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_document_workflows
    AFTER INSERT OR UPDATE OR DELETE ON document_workflows
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_documents
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_firm_invitations
    AFTER INSERT OR UPDATE OR DELETE ON firm_invitations
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_firm_locations
    AFTER INSERT OR UPDATE OR DELETE ON firm_locations
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_firm_practice_areas
    AFTER INSERT OR UPDATE OR DELETE ON firm_practice_areas
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_firm_users
    AFTER INSERT OR UPDATE OR DELETE ON firm_users
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_firms
    AFTER INSERT OR UPDATE OR DELETE ON firms
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_invoices
    AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_jurisdictions
    AFTER INSERT OR UPDATE OR DELETE ON jurisdictions
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_law_firms
    AFTER INSERT OR UPDATE OR DELETE ON law_firms
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_leads
    AFTER INSERT OR UPDATE OR DELETE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_messages
    AFTER INSERT OR UPDATE OR DELETE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_notes
    AFTER INSERT OR UPDATE OR DELETE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_onboarding_audit_logs
    AFTER INSERT OR UPDATE OR DELETE ON onboarding_audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_practice_areas
    AFTER INSERT OR UPDATE OR DELETE ON practice_areas
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_priorities
    AFTER INSERT OR UPDATE OR DELETE ON priorities
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_professional_ids
    AFTER INSERT OR UPDATE OR DELETE ON professional_ids
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_profiles
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_roles
    AFTER INSERT OR UPDATE OR DELETE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_schedules
    AFTER INSERT OR UPDATE OR DELETE ON schedules
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_teams
    AFTER INSERT OR UPDATE OR DELETE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_time_entries
    AFTER INSERT OR UPDATE OR DELETE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_user_activities
    AFTER INSERT OR UPDATE OR DELETE ON user_activities
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_user_metrics
    AFTER INSERT OR UPDATE OR DELETE ON user_metrics
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_workflow_optimizations
    AFTER INSERT OR UPDATE OR DELETE ON workflow_optimizations
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_document_tag_relationships
    AFTER INSERT OR UPDATE OR DELETE ON document_tag_relationships
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_tasks
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_law_firm_associations
    AFTER INSERT OR UPDATE OR DELETE ON law_firm_associations
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_changes(); 