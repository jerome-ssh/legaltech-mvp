-- Migration: Create firm tables
-- Description: This migration creates tables for firm management.

-- Create firm-related tables
CREATE TABLE public.firms (
    id uuid PRIMARY KEY,
    name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.firm_users (
    id uuid PRIMARY KEY,
    firm_id uuid REFERENCES public.firms(id),
    user_id uuid REFERENCES public.users(id),
    role text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create firm-related functions
CREATE FUNCTION public.update_firm_users_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create firm-related triggers
CREATE TRIGGER update_firm_users_updated_at BEFORE UPDATE ON public.firm_users FOR EACH ROW EXECUTE FUNCTION public.update_firm_users_updated_at(); 