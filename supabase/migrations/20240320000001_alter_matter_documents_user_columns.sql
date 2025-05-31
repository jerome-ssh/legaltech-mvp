-- Drop foreign key constraints if they exist
ALTER TABLE public.matter_documents
  DROP CONSTRAINT IF EXISTS fk_matter_documents_created_by,
  DROP CONSTRAINT IF EXISTS fk_matter_documents_updated_by;

-- Change column types to text
ALTER TABLE public.matter_documents
  ALTER COLUMN created_by TYPE text,
  ALTER COLUMN updated_by TYPE text;

-- Optionally, add comments for clarity
COMMENT ON COLUMN public.matter_documents.created_by IS 'ID of the user who created the document (Clerk string ID)';
COMMENT ON COLUMN public.matter_documents.updated_by IS 'ID of the user who last updated the document (Clerk string ID)'; 