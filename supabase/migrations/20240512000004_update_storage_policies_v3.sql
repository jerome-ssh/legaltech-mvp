-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to manage avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to avatars" ON storage.objects;

-- Create a single policy for authenticated users
CREATE POLICY "Allow all operations for authenticated users"
ON storage.objects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create a policy for public access
CREATE POLICY "Allow public access"
ON storage.objects
FOR SELECT
TO public
USING (true); 