-- Drop existing constraint if it exists
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_clerk_id_key;

-- Recreate the unique constraint on clerk_id
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_clerk_id_key UNIQUE (clerk_id);

-- Ensure role column exists and has correct values
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'lawyer', 'client')); 