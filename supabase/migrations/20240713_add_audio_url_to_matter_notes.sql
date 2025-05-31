-- Migration: Add audio_url to matter_notes
ALTER TABLE public.matter_notes
  ADD COLUMN IF NOT EXISTS audio_url text; 