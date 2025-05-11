-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to manage avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;

-- Create a single policy for all operations
CREATE POLICY "Allow all operations for authenticated users"
ON storage.objects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create a policy for public access to avatars
CREATE POLICY "Allow public access to avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Ensure the avatars bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true; 