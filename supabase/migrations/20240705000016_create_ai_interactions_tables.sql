-- Migration: Create AI interactions tables
-- Description: This migration creates tables for AI interactions management.

-- Create AI interactions-related tables
CREATE TABLE public.ai_interactions (
    id uuid PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id),
    interaction_type text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create AI interactions-related functions
CREATE FUNCTION public.update_ai_interactions_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create AI interactions-related triggers
CREATE TRIGGER update_ai_interactions_updated_at BEFORE UPDATE ON public.ai_interactions FOR EACH ROW EXECUTE FUNCTION public.update_ai_interactions_updated_at(); 