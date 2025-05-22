-- Update existing schedules to set profile_id based on user_id
UPDATE public.schedules s
SET profile_id = p.id
FROM public.profiles p
WHERE s.user_id = p.clerk_id::uuid
AND s.profile_id IS NULL;

-- Add NOT NULL constraint after updating existing records
ALTER TABLE public.schedules 
ALTER COLUMN profile_id SET NOT NULL; 