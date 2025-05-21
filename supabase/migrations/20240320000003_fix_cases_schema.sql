-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own cases" ON cases;
DROP POLICY IF EXISTS "Users can insert their own cases" ON cases;
DROP POLICY IF EXISTS "Users can update their own cases" ON cases;
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view their own feedback" ON client_feedback;

-- Update foreign key reference
ALTER TABLE cases
    DROP CONSTRAINT IF EXISTS cases_assigned_to_fkey;

-- Recreate policies with correct column names
CREATE POLICY "Users can view their own cases"
    ON cases FOR SELECT
    USING (auth.uid() = client_id OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = cases.profile_id 
        AND profiles.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own cases"
    ON cases FOR INSERT
    WITH CHECK (auth.uid() = client_id OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = cases.profile_id 
        AND profiles.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own cases"
    ON cases FOR UPDATE
    USING (auth.uid() = client_id OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = cases.profile_id 
        AND profiles.user_id = auth.uid()
    ));

-- Update tasks policies
CREATE POLICY "Users can view their own tasks"
    ON tasks FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cases
        WHERE cases.id = tasks.case_id
        AND (cases.client_id = auth.uid() OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = cases.profile_id 
            AND profiles.user_id = auth.uid()
        ))
    ));

CREATE POLICY "Users can insert their own tasks"
    ON tasks FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM cases
        WHERE cases.id = tasks.case_id
        AND (cases.client_id = auth.uid() OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = cases.profile_id 
            AND profiles.user_id = auth.uid()
        ))
    ));

CREATE POLICY "Users can update their own tasks"
    ON tasks FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM cases
        WHERE cases.id = tasks.case_id
        AND (cases.client_id = auth.uid() OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = cases.profile_id 
            AND profiles.user_id = auth.uid()
        ))
    ));

-- Update client feedback policies
CREATE POLICY "Users can view their own feedback"
    ON client_feedback FOR SELECT
    USING (auth.uid() = client_id OR EXISTS (
        SELECT 1 FROM cases
        WHERE cases.id = client_feedback.case_id
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = cases.profile_id 
            AND profiles.user_id = auth.uid()
        )
    )); 