-- Migration: Create tasks tables
-- Description: This migration creates tables for tasks management.

-- Create tasks-related tables
CREATE TABLE public.tasks (
    id uuid PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id),
    title text,
    status text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create tasks-related functions
CREATE FUNCTION public.update_tasks_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create tasks-related triggers
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_tasks_updated_at(); 