-- Add clerk_id column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS clerk_id TEXT;

-- Update existing profiles to use user_id as clerk_id
UPDATE public.profiles
SET clerk_id = user_id::text
WHERE clerk_id IS NULL;

-- Add unique constraint on clerk_id
ALTER TABLE public.profiles
ADD CONSTRAINT unique_clerk_id UNIQUE (clerk_id);

-- Create index on clerk_id
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_id ON public.profiles(clerk_id); 