-- Migration: Create user activities tables
-- Description: This migration creates tables for user activities management.

-- Create user activities-related tables
CREATE TABLE public.user_activities (
    id uuid PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id),
    action text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create user activities-related functions
CREATE FUNCTION public.update_user_activities_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user activities-related triggers
CREATE TRIGGER update_user_activities_updated_at BEFORE UPDATE ON public.user_activities FOR EACH ROW EXECUTE FUNCTION public.update_user_activities_updated_at(); 