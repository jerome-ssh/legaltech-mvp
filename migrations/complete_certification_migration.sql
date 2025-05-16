-- COMPREHENSIVE MIGRATION SCRIPT FOR CERTIFICATION ENHANCEMENTS

-- 1. Add document-related fields to professional_ids table
ALTER TABLE professional_ids
ADD COLUMN IF NOT EXISTS document_url VARCHAR(1024),
ADD COLUMN IF NOT EXISTS document_name VARCHAR(255);

-- 2. Add enhanced certification fields
ALTER TABLE professional_ids
ADD COLUMN IF NOT EXISTS issuing_authority VARCHAR(255),
ADD COLUMN IF NOT EXISTS issue_date DATE;

-- 3. Create a bucket for certificates if it doesn't exist
BEGIN;
  -- Try to create the bucket
  INSERT INTO storage.buckets (id, name, public)
  SELECT 'certificates', 'certificates', true
  WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'certificates'
  );
COMMIT;

-- 4. Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own certificates" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own certificates" ON storage.objects;
DROP POLICY IF EXISTS "Public can read certificates" ON storage.objects;

-- 5. Add RLS policies for certificates bucket
-- 5.1 Policy for uploading certificates (only the user can upload their own certificates)
CREATE POLICY "Users can upload their own certificates"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'certificates' AND
  (auth.uid()::text = (storage.foldername(name))[1])
);

-- 5.2 Policy for reading certificates (allow read access for certificate owners)
CREATE POLICY "Users can read their own certificates"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'certificates' AND
  (auth.uid()::text = (storage.foldername(name))[1])
);

-- 5.3 Policy to allow public access to read certificates
CREATE POLICY "Public can read certificates"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'certificates'); 