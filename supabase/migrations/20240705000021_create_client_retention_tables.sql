-- Migration: Create client retention tables
-- Description: This migration creates tables for client retention management.

-- Create client retention-related tables
CREATE TABLE public.client_retention (
    id uuid PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id),
    retention_rate numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create client retention-related functions
CREATE FUNCTION public.update_client_retention_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create client retention-related triggers
CREATE TRIGGER update_client_retention_updated_at BEFORE UPDATE ON public.client_retention FOR EACH ROW EXECUTE FUNCTION public.update_client_retention_updated_at(); 