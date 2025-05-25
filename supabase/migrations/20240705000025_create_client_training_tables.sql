-- Migration: Create client training tables
-- Description: This migration creates tables for client training management.

-- Create client training-related tables
CREATE TABLE public.client_training (
    id uuid PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id),
    training_type text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create client training-related functions
CREATE FUNCTION public.update_client_training_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create client training-related triggers
CREATE TRIGGER update_client_training_updated_at BEFORE UPDATE ON public.client_training FOR EACH ROW EXECUTE FUNCTION public.update_client_training_updated_at(); 