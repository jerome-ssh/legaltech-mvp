-- Add document-related fields to professional_ids table
ALTER TABLE professional_ids
ADD COLUMN IF NOT EXISTS document_url VARCHAR(1024),
ADD COLUMN IF NOT EXISTS document_name VARCHAR(255);

-- Create a bucket for certificates if it doesn't exist
BEGIN;
  -- Try to create the bucket
  INSERT INTO storage.buckets (id, name, public)
  SELECT 'certificates', 'certificates', true
  WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'certificates'
  );
COMMIT;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own certificates" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own certificates" ON storage.objects;
DROP POLICY IF EXISTS "Public can read certificates" ON storage.objects;

-- Add RLS policies for certificates bucket
-- 1. Policy for uploading certificates (only the user can upload their own certificates)
CREATE POLICY "Users can upload their own certificates"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'certificates' AND
  (auth.uid() = storage.foldername(name)[1])
);

-- 2. Policy for reading certificates (allow read access for certificate owners)
CREATE POLICY "Users can read their own certificates"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'certificates' AND
  (auth.uid() = storage.foldername(name)[1])
);

-- 3. Policy to allow public access to read certificates
CREATE POLICY "Public can read certificates"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'certificates'); 