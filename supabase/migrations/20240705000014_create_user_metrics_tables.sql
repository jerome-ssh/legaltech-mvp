-- Migration: Create user metrics tables
-- Description: This migration creates tables for user metrics management.

-- Create user metrics-related tables
CREATE TABLE public.user_metrics (
    id uuid PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id),
    metric_name text,
    metric_value numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create user metrics-related functions
CREATE FUNCTION public.update_user_metrics_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user metrics-related triggers
CREATE TRIGGER update_user_metrics_updated_at BEFORE UPDATE ON public.user_metrics FOR EACH ROW EXECUTE FUNCTION public.update_user_metrics_updated_at(); 