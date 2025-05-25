-- Migration: Create client feedback tables
-- Description: This migration creates tables for client feedback management.

-- Create client feedback-related tables
CREATE TABLE public.client_feedback (
    id uuid PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id),
    feedback_text text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create client feedback-related functions
CREATE FUNCTION public.update_client_feedback_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create client feedback-related triggers
CREATE TRIGGER update_client_feedback_updated_at BEFORE UPDATE ON public.client_feedback FOR EACH ROW EXECUTE FUNCTION public.update_client_feedback_updated_at(); 