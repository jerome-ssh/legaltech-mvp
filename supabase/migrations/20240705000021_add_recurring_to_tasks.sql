-- Migration: Add is_recurring to tasks
-- Description: This migration adds the is_recurring column to the tasks table.

-- Add is_recurring column to tasks table
ALTER TABLE public.tasks
ADD COLUMN is_recurring boolean DEFAULT false;

-- Add index for better performance
CREATE INDEX idx_tasks_is_recurring ON public.tasks(is_recurring); 