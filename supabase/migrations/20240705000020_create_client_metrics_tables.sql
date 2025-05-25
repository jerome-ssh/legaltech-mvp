-- Migration: Create client metrics tables
-- Description: This migration creates tables for client metrics management.

-- Create client metrics-related tables
CREATE TABLE public.client_metrics (
    id uuid PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id),
    metric_name text,
    metric_value numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create client metrics-related functions
CREATE FUNCTION public.update_client_metrics_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create client metrics-related triggers
CREATE TRIGGER update_client_metrics_updated_at BEFORE UPDATE ON public.client_metrics FOR EACH ROW EXECUTE FUNCTION public.update_client_metrics_updated_at(); 