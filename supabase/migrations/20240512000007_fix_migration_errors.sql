-- Add client_id to client_feedback if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='client_feedback' AND column_name='client_id'
    ) THEN
        ALTER TABLE client_feedback ADD COLUMN client_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Drop and recreate billing policies to avoid duplicates
DROP POLICY IF EXISTS "Users can view billing data" ON billing;
CREATE POLICY "Users can view billing data"
    ON billing FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert billing data" ON billing;
CREATE POLICY "Users can insert billing data"
    ON billing FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update billing data" ON billing;
CREATE POLICY "Users can update billing data"
    ON billing FOR UPDATE
    USING (true);

-- Drop and recreate client_feedback policies to avoid duplicates and reference the new column
DROP POLICY IF EXISTS "Users can view their own feedback" ON client_feedback;
CREATE POLICY "Users can view their own feedback"
    ON client_feedback FOR SELECT
    USING (
        auth.uid() = client_id OR EXISTS (
            SELECT 1 FROM cases
            WHERE cases.id = client_feedback.case_id
            AND cases.assigned_to = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert their own feedback" ON client_feedback;
CREATE POLICY "Users can insert their own feedback"
    ON client_feedback FOR INSERT
    WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Users can update their own feedback" ON client_feedback;
CREATE POLICY "Users can update their own feedback"
    ON client_feedback FOR UPDATE
    USING (auth.uid() = client_id); 