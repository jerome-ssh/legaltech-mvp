-- Migration: Create AI tasks tables
-- Description: This migration creates tables for AI tasks management.

-- Create AI tasks-related tables
CREATE TABLE public.ai_tasks (
    id uuid PRIMARY KEY,
    case_id uuid REFERENCES public.matters(id),
    document_id uuid REFERENCES public.documents(id),
    task_type text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create AI tasks-related functions
CREATE FUNCTION public.update_ai_tasks_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create AI tasks-related triggers
CREATE TRIGGER update_ai_tasks_updated_at BEFORE UPDATE ON public.ai_tasks FOR EACH ROW EXECUTE FUNCTION public.update_ai_tasks_updated_at(); 