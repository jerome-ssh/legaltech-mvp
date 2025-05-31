-- Migration: Add title to matter_notes
ALTER TABLE public.matter_notes
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Untitled Note'; 