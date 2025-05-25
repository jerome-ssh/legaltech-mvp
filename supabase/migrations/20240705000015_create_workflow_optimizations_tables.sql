-- Migration: Create workflow optimizations tables
-- Description: This migration creates tables for workflow optimizations management.

-- Create workflow optimizations-related tables
CREATE TABLE public.workflow_optimizations (
    id uuid PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id),
    optimization_name text,
    optimization_value numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create workflow optimizations-related functions
CREATE FUNCTION public.update_workflow_optimizations_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create workflow optimizations-related triggers
CREATE TRIGGER update_workflow_optimizations_updated_at BEFORE UPDATE ON public.workflow_optimizations FOR EACH ROW EXECUTE FUNCTION public.update_workflow_optimizations_updated_at(); 