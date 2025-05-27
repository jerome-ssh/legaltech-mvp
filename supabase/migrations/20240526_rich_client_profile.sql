-- Migration: Enhance clients table for rich client profile and clean up legacy fields

-- Remove legacy one-to-one matter fields
ALTER TABLE public.clients
  DROP COLUMN IF EXISTS matter_id,
  DROP COLUMN IF EXISTS matter_status_id;

-- Add rich profile fields
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS tags text[],
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS client_source text,
  ADD COLUMN IF NOT EXISTS custom_fields jsonb;

-- Optionally, add indexes for new fields if needed
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON public.clients (is_active);
CREATE INDEX IF NOT EXISTS idx_clients_company_name ON public.clients (company_name); 