-- Migration: Create time entries tables
-- Description: This migration creates tables for time entries management.

-- Create time entries-related tables
CREATE TABLE public.time_entries (
    id uuid PRIMARY KEY,
    case_id uuid REFERENCES public.matters(id),
    user_id uuid REFERENCES public.users(id),
    duration interval,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create time entries-related functions
CREATE FUNCTION public.update_time_entries_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create time entries-related triggers
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON public.time_entries FOR EACH ROW EXECUTE FUNCTION public.update_time_entries_updated_at(); 