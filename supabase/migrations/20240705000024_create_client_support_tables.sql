-- Migration: Create client support tables
-- Description: This migration creates tables for client support management.

-- Create client support-related tables
CREATE TABLE public.client_support (
    id uuid PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id),
    support_type text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create client support-related functions
CREATE FUNCTION public.update_client_support_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create client support-related triggers
CREATE TRIGGER update_client_support_updated_at BEFORE UPDATE ON public.client_support FOR EACH ROW EXECUTE FUNCTION public.update_client_support_updated_at(); 