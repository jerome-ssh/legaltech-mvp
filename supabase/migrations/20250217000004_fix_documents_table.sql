-- Rename status column to compliance_status in documents table
ALTER TABLE public.documents 
    RENAME COLUMN status TO compliance_status; 