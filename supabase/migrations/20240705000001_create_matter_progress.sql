-- Create matter_progress table
CREATE TABLE public.matter_progress (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    matter_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    status text NOT NULL,
    notes text,
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT matter_progress_pkey PRIMARY KEY (id),
    CONSTRAINT fk_matter_progress_matter FOREIGN KEY (matter_id) 
        REFERENCES matters(id) ON DELETE CASCADE,
    CONSTRAINT fk_matter_progress_profile FOREIGN KEY (profile_id) 
        REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_matter_progress_matter_id ON public.matter_progress(matter_id);
CREATE INDEX idx_matter_progress_profile_id ON public.matter_progress(profile_id);
CREATE INDEX idx_matter_progress_status ON public.matter_progress(status);

-- Add RLS policies
ALTER TABLE public.matter_progress ENABLE ROW LEVEL SECURITY;

-- Policy for viewing matter progress
CREATE POLICY "Users can view matter progress for their matters"
    ON public.matter_progress
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM matters
            WHERE matters.id = matter_progress.matter_id
            AND matters.profile_id = auth.uid()
        )
    );

-- Policy for inserting matter progress
CREATE POLICY "Users can insert matter progress for their matters"
    ON public.matter_progress
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM matters
            WHERE matters.id = matter_progress.matter_id
            AND matters.profile_id = auth.uid()
        )
    );

-- Policy for updating matter progress
CREATE POLICY "Users can update matter progress for their matters"
    ON public.matter_progress
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM matters
            WHERE matters.id = matter_progress.matter_id
            AND matters.profile_id = auth.uid()
        )
    );

-- Policy for deleting matter progress
CREATE POLICY "Users can delete matter progress for their matters"
    ON public.matter_progress
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM matters
            WHERE matters.id = matter_progress.matter_id
            AND matters.profile_id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_matter_progress_updated_at
    BEFORE UPDATE ON public.matter_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 