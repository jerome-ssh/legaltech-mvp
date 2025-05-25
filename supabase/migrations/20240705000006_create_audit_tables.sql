-- Migration: Create audit tables
-- Description: This migration creates tables for audit management.

-- Create audit-related tables
CREATE TABLE public.audit_log (
    id uuid PRIMARY KEY,
    table_name text,
    record_id uuid,
    changed_by uuid REFERENCES public.users(id),
    changed_at timestamp with time zone DEFAULT now()
);

-- Create audit-related functions
CREATE FUNCTION public.log_audit_changes() RETURNS trigger AS $$
BEGIN
    INSERT INTO public.audit_log (table_name, record_id, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create audit-related triggers
CREATE TRIGGER audit_audit_log AFTER INSERT OR DELETE OR UPDATE ON public.audit_log FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes(); 