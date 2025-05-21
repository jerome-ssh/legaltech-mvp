-- Add uploaded_by column to documents table
ALTER TABLE documents
ADD COLUMN uploaded_by UUID REFERENCES auth.users(id);

-- Update existing documents to set uploaded_by to the user who created them
-- This assumes the documents were created by the authenticated user
UPDATE documents
SET uploaded_by = auth.uid()
WHERE uploaded_by IS NULL;

-- Make uploaded_by NOT NULL after setting existing values
ALTER TABLE documents
ALTER COLUMN uploaded_by SET NOT NULL;

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by); 