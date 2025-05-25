-- Migration: Create client tables
-- Description: This migration creates tables for client management.

-- Create client-related tables
CREATE TABLE public.clients (
    id uuid PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id),
    first_name text,
    last_name text,
    email text,
    phone text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create client-related functions
CREATE FUNCTION public.ensure_phone_not_null() RETURNS trigger AS $$
BEGIN
    IF NEW.phone IS NULL THEN
        RAISE EXCEPTION 'Phone number cannot be null';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create client-related triggers
CREATE TRIGGER ensure_phone_not_null_trigger BEFORE INSERT OR UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.ensure_phone_not_null(); 