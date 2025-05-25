-- Migration: Create roles tables
-- Description: This migration creates tables for roles management.

-- Create roles-related tables
CREATE TABLE public.roles (
    id uuid PRIMARY KEY,
    name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create roles-related functions
CREATE FUNCTION public.update_roles_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create roles-related triggers
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_roles_updated_at(); 