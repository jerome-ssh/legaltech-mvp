-- Migration: Create client workflow optimizations tables
-- Description: This migration creates tables for client workflow optimizations management.

-- Create client workflow optimizations-related tables
CREATE TABLE public.client_workflow_optimizations (
    id uuid PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id),
    optimization_type text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create client workflow optimizations-related functions
CREATE FUNCTION public.update_client_workflow_optimizations_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create client workflow optimizations-related triggers
CREATE TRIGGER update_client_workflow_optimizations_updated_at BEFORE UPDATE ON public.client_workflow_optimizations FOR EACH ROW EXECUTE FUNCTION public.update_client_workflow_optimizations_updated_at(); 