-- Update matter_documents table with new fields
ALTER TABLE public.matter_documents
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS type text,
ADD COLUMN IF NOT EXISTS size bigint,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending_review',
ADD COLUMN IF NOT EXISTS category text DEFAULT 'uncategorized',
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS uploaded_at timestamp with time zone DEFAULT now();

-- Add constraints for new fields
ALTER TABLE public.matter_documents
ADD CONSTRAINT matter_documents_status_check 
CHECK (status IN ('active', 'archived', 'pending_review'));

-- Create index for faster document searches
CREATE INDEX IF NOT EXISTS idx_matter_documents_status 
ON public.matter_documents(status);

CREATE INDEX IF NOT EXISTS idx_matter_documents_category 
ON public.matter_documents(category);

CREATE INDEX IF NOT EXISTS idx_matter_documents_uploaded_at 
ON public.matter_documents(uploaded_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_matter_documents_updated_at ON public.matter_documents;

CREATE TRIGGER update_matter_documents_updated_at
    BEFORE UPDATE ON public.matter_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE public.matter_documents IS 'Stores documents associated with legal matters, including AI analysis metadata';

-- Add comments to columns
COMMENT ON COLUMN public.matter_documents.name IS 'Original name of the document';
COMMENT ON COLUMN public.matter_documents.type IS 'MIME type of the document';
COMMENT ON COLUMN public.matter_documents.size IS 'Size of the document in bytes';
COMMENT ON COLUMN public.matter_documents.status IS 'Current status of the document (active, archived, pending_review)';
COMMENT ON COLUMN public.matter_documents.category IS 'Category of the document (pleadings, correspondence, evidence, etc.)';
COMMENT ON COLUMN public.matter_documents.version IS 'Version number of the document';
COMMENT ON COLUMN public.matter_documents.metadata IS 'Additional metadata including AI analysis results';
COMMENT ON COLUMN public.matter_documents.uploaded_at IS 'Timestamp when the document was uploaded'; 