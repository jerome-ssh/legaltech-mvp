-- Migration: Create client usage tables
-- Description: This migration creates tables for client usage management.

-- Create client usage-related tables
CREATE TABLE public.client_usage (
    id uuid PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id),
    usage_type text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create client usage-related functions
CREATE FUNCTION public.update_client_usage_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create client usage-related triggers
CREATE TRIGGER update_client_usage_updated_at BEFORE UPDATE ON public.client_usage FOR EACH ROW EXECUTE FUNCTION public.update_client_usage_updated_at(); 