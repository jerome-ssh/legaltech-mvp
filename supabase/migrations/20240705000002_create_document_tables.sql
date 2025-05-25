-- Migration: Create document tables
-- Description: This migration creates tables for document management.

-- Create document-related tables
CREATE TABLE public.documents (
    id uuid PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id),
    uploaded_by uuid REFERENCES public.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.document_versions (
    id uuid PRIMARY KEY,
    document_id uuid REFERENCES public.documents(id),
    created_by uuid REFERENCES public.users(id),
    created_at timestamp with time zone DEFAULT now()
);

-- Create document-related functions
CREATE FUNCTION public.log_document_changes() RETURNS trigger AS $$
BEGIN
    INSERT INTO public.document_versions (document_id, created_by)
    VALUES (NEW.id, NEW.uploaded_by);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create document-related triggers
CREATE TRIGGER audit_documents AFTER INSERT OR DELETE OR UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.log_document_changes(); 