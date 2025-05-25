ALTER TABLE public.matters
  ADD COLUMN intake_data jsonb;
COMMENT ON COLUMN public.matters.intake_data IS 'Stores extra intake-specific data from the client intake form as JSON.'; 