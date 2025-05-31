-- Migration: Add matter_note_attachments table
CREATE TABLE public.matter_note_attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id uuid REFERENCES matter_notes(id) ON DELETE CASCADE,
    file_url text NOT NULL,
    file_type text,
    uploaded_at timestamp with time zone DEFAULT now()
); 