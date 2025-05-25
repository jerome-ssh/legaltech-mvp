-- Migration: Create client workflow tables
-- Description: This migration creates tables for client workflow management.

-- Create client workflow-related tables
CREATE TABLE public.client_workflow (
    id uuid PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id),
    workflow_type text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create client workflow-related functions
CREATE FUNCTION public.update_client_workflow_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create client workflow-related triggers
CREATE TRIGGER update_client_workflow_updated_at BEFORE UPDATE ON public.client_workflow FOR EACH ROW EXECUTE FUNCTION public.update_client_workflow_updated_at(); 