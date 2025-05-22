-- Drop existing constraints if they exist
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_clerk_id_key;

-- Add unique constraint on clerk_id
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_clerk_id_key UNIQUE (clerk_id);

-- Ensure role column exists with correct values
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'lawyer', 'client'));

-- Update RLS policies for profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (
        clerk_id = auth.jwt()->>'sub'
    );

CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (
        clerk_id = auth.jwt()->>'sub'
    );

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY; 