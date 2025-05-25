-- Migration: Drop unique constraint on name in matter_status
ALTER TABLE public.matter_status
DROP CONSTRAINT IF EXISTS matter_status_name_key; 