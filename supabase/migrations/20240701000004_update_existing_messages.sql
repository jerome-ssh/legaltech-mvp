-- Update existing messages to set profile_id based on sender_id
UPDATE public.messages m
SET profile_id = p.id
FROM public.profiles p
WHERE m.sender_id = p.clerk_id
AND m.profile_id IS NULL;

-- Add NOT NULL constraint after updating existing records
ALTER TABLE public.messages 
ALTER COLUMN profile_id SET NOT NULL; 