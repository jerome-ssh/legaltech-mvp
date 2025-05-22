-- Update existing leads to set profile_id based on user_id
UPDATE public.leads l
SET profile_id = p.id
FROM public.profiles p
WHERE l.user_id = p.clerk_id::uuid
AND l.profile_id IS NULL;

-- Add NOT NULL constraint after updating existing records
ALTER TABLE public.leads 
ALTER COLUMN profile_id SET NOT NULL; 