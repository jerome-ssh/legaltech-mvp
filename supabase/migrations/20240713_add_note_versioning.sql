-- Migration: Add matter_note_versions table for version history
CREATE TABLE public.matter_note_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id uuid REFERENCES matter_notes(id) ON DELETE CASCADE,
    version_number integer NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    author_id uuid REFERENCES profiles(id)
); 