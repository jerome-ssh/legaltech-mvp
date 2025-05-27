-- Migration: Expand matters and clients for futuristic MatterCard

-- Add new columns to matters table if not present
ALTER TABLE public.matters
  ADD COLUMN IF NOT EXISTS jurisdiction text,
  ADD COLUMN IF NOT EXISTS deadline date,
  ADD COLUMN IF NOT EXISTS assigned_to uuid, -- references profiles(id)
  ADD COLUMN IF NOT EXISTS tags text[],      -- array of tags
  ADD COLUMN IF NOT EXISTS progress integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_value numeric;

-- Add avatar_url to clients table if not present
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add matter_tags table for many-to-many tags
CREATE TABLE IF NOT EXISTS public.matter_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id uuid REFERENCES public.matters(id),
  tag text
);

-- Add matter_notes table for quick notes
CREATE TABLE IF NOT EXISTS public.matter_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id uuid REFERENCES public.matters(id),
  author_id uuid REFERENCES public.profiles(id),
  content text,
  created_at timestamp with time zone DEFAULT now()
); 