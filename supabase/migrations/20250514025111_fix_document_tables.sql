-- Fix document table inconsistencies
BEGIN;

-- Fix case_documents table
ALTER TABLE case_documents
ALTER COLUMN id TYPE UUID USING id::uuid;

-- Fix documents table uploaded_by
ALTER TABLE documents
ALTER COLUMN uploaded_by TYPE UUID USING uploaded_by::uuid,
ADD CONSTRAINT fk_documents_uploaded_by 
FOREIGN KEY (uploaded_by) REFERENCES auth.users(id);

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_case_documents_document_id ON case_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_case_documents_case_id ON case_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- Add missing constraints
ALTER TABLE case_documents
ADD CONSTRAINT fk_case_documents_document
FOREIGN KEY (document_id) REFERENCES documents(id),
ADD CONSTRAINT fk_case_documents_case
FOREIGN KEY (case_id) REFERENCES cases(id);

-- Add missing NOT NULL constraints
ALTER TABLE case_documents
ALTER COLUMN document_id SET NOT NULL,
ALTER COLUMN case_id SET NOT NULL;

-- Add missing timestamps
ALTER TABLE case_documents
ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now()),
ALTER COLUMN updated_at SET DEFAULT timezone('utc'::text, now());

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_case_documents_updated_at
    BEFORE UPDATE ON case_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT; 