-- Migration: Create client satisfaction tables
-- Description: This migration creates tables for client satisfaction management.

-- Create client satisfaction-related tables
CREATE TABLE public.client_satisfaction (
    id uuid PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id),
    satisfaction_score numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create client satisfaction-related functions
CREATE FUNCTION public.update_client_satisfaction_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create client satisfaction-related triggers
CREATE TRIGGER update_client_satisfaction_updated_at BEFORE UPDATE ON public.client_satisfaction FOR EACH ROW EXECUTE FUNCTION public.update_client_satisfaction_updated_at(); 