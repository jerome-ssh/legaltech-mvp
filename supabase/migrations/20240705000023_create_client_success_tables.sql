-- Migration: Create client success tables
-- Description: This migration creates tables for client success management.

-- Create client success-related tables
CREATE TABLE public.client_success (
    id uuid PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id),
    success_metric text,
    success_value numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create client success-related functions
CREATE FUNCTION public.update_client_success_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create client success-related triggers
CREATE TRIGGER update_client_success_updated_at BEFORE UPDATE ON public.client_success FOR EACH ROW EXECUTE FUNCTION public.update_client_success_updated_at(); 