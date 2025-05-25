-- Migration: Create matter tables
-- Description: This migration creates tables for matter management.

-- Create matter-related tables
CREATE TABLE public.matters (
    id uuid PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id),
    title text,
    matter_type text,
    status text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.matter_team (
    id uuid PRIMARY KEY,
    matter_id uuid REFERENCES public.matters(id),
    profile_id uuid REFERENCES public.profiles(id),
    role_id uuid REFERENCES public.roles(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create matter-related functions
CREATE FUNCTION public.update_matter_team_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create matter-related triggers
CREATE TRIGGER update_matter_team_updated_at BEFORE UPDATE ON public.matter_team FOR EACH ROW EXECUTE FUNCTION public.update_matter_team_updated_at(); 