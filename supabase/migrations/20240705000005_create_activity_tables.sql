-- Migration: Create activity tables
-- Description: This migration creates tables for activity management.

-- Create activity-related tables
CREATE TABLE public.activity (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES public.users(id),
    action text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.activity_logs (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES public.users(id),
    target_id uuid,
    action text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create activity-related functions
CREATE FUNCTION public.log_audit_changes() RETURNS trigger AS $$
BEGIN
    INSERT INTO public.activity_logs (user_id, target_id, action)
    VALUES (NEW.user_id, NEW.id, TG_OP);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create activity-related triggers
CREATE TRIGGER audit_activity AFTER INSERT OR DELETE OR UPDATE ON public.activity FOR EACH ROW EXECUTE FUNCTION public.log_audit_changes(); 