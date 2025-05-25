-- Migration: Fix schema issues
-- Description: This migration fixes various schema issues including missing columns and permissions.

-- Add is_recurring column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false;

-- Add status column to matters table
ALTER TABLE public.matters 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' 
CHECK (status IN ('active', 'inactive', 'completed', 'archived'));

-- Fix client_feedback permissions
ALTER TABLE public.client_feedback ENABLE ROW LEVEL SECURITY;

-- Create policy for client_feedback
CREATE POLICY "Enable read access for authenticated users" ON public.client_feedback
    FOR SELECT
    TO authenticated
    USING (true);

-- Create policy for service role
CREATE POLICY "Enable all access for service role" ON public.client_feedback
    FOR ALL
    TO service_role
    USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_is_recurring ON public.tasks(is_recurring);
CREATE INDEX IF NOT EXISTS idx_matters_status ON public.matters(status);
CREATE INDEX IF NOT EXISTS idx_client_feedback_rating ON public.client_feedback(rating); 