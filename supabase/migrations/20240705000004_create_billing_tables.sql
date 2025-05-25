-- Migration: Create billing tables
-- Description: This migration creates tables for billing management.

-- Create billing-related tables
CREATE TABLE public.billing (
    id uuid PRIMARY KEY,
    matter_id uuid REFERENCES public.matters(id),
    amount numeric,
    currency text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.billing_methods (
    id uuid PRIMARY KEY,
    name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create billing-related functions
CREATE FUNCTION public.update_billing_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create billing-related triggers
CREATE TRIGGER update_billing_updated_at BEFORE UPDATE ON public.billing FOR EACH ROW EXECUTE FUNCTION public.update_billing_updated_at(); 