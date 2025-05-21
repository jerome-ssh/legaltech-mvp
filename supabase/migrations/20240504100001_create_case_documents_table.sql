-- Create case_documents table
CREATE TABLE IF NOT EXISTS public.case_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(case_id, document_id)
);

-- Add RLS policies
ALTER TABLE public.case_documents ENABLE ROW LEVEL SECURITY;

-- Policy for viewing case documents
CREATE POLICY "Users can view case documents they have access to"
    ON public.case_documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.cases
            WHERE cases.id = case_documents.case_id
            AND (
                cases.created_by = auth.uid()
                OR cases.assigned_to = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.case_participants
                    WHERE case_participants.case_id = cases.id
                    AND case_participants.user_id = auth.uid()
                )
            )
        )
    );

-- Policy for inserting case documents
CREATE POLICY "Users can add documents to cases they have access to"
    ON public.case_documents
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.cases
            WHERE cases.id = case_documents.case_id
            AND (
                cases.created_by = auth.uid()
                OR cases.assigned_to = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.case_participants
                    WHERE case_participants.case_id = cases.id
                    AND case_participants.user_id = auth.uid()
                )
            )
        )
    );

-- Policy for updating case documents
CREATE POLICY "Users can update case documents they have access to"
    ON public.case_documents
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.cases
            WHERE cases.id = case_documents.case_id
            AND (
                cases.created_by = auth.uid()
                OR cases.assigned_to = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.case_participants
                    WHERE case_participants.case_id = cases.id
                    AND case_participants.user_id = auth.uid()
                )
            )
        )
    );

-- Policy for deleting case documents
CREATE POLICY "Users can delete case documents they have access to"
    ON public.case_documents
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.cases
            WHERE cases.id = case_documents.case_id
            AND (
                cases.created_by = auth.uid()
                OR cases.assigned_to = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.case_participants
                    WHERE case_participants.case_id = cases.id
                    AND case_participants.user_id = auth.uid()
                )
            )
        )
    );

-- Create indexes
CREATE INDEX case_documents_case_id_idx ON public.case_documents(case_id);
CREATE INDEX case_documents_document_id_idx ON public.case_documents(document_id);
CREATE INDEX case_documents_created_by_idx ON public.case_documents(created_by);
CREATE INDEX case_documents_updated_by_idx ON public.case_documents(updated_by); 