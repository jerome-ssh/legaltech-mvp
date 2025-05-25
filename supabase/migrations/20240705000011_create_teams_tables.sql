-- Migration: Create teams tables
-- Description: This migration creates tables for teams management.

-- Create teams-related tables
CREATE TABLE public.teams (
    id uuid PRIMARY KEY,
    name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create teams-related functions
CREATE FUNCTION public.update_teams_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create teams-related triggers
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_teams_updated_at(); 