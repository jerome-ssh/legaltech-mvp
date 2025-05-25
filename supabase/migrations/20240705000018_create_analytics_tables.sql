-- Migration: Create analytics tables
-- Description: This migration creates tables for analytics management.

-- Create analytics-related tables
CREATE TABLE public.analytics (
    id uuid PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id),
    metric_name text,
    metric_value numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create analytics-related functions
CREATE FUNCTION public.update_analytics_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create analytics-related triggers
CREATE TRIGGER update_analytics_updated_at BEFORE UPDATE ON public.analytics FOR EACH ROW EXECUTE FUNCTION public.update_analytics_updated_at(); 