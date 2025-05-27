-- Create enum for task status
CREATE TYPE task_status AS ENUM ('Not Started', 'In Progress', 'Completed');

-- Create enum for task stage
CREATE TYPE task_stage AS ENUM ('Intake', 'Planning', 'Active Work', 'Closure');

-- Create matter_tasks table
CREATE TABLE matter_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    stage task_stage NOT NULL,
    weight INTEGER NOT NULL DEFAULT 1 CHECK (weight > 0),
    status task_status NOT NULL DEFAULT 'Not Started',
    due_date TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES profiles(id),
    is_custom BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES profiles(id),
    updated_by UUID NOT NULL REFERENCES profiles(id)
);

-- Create matter_task_history table
CREATE TABLE matter_task_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES matter_tasks(id) ON DELETE CASCADE,
    status task_status NOT NULL,
    changed_by UUID NOT NULL REFERENCES profiles(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Create indexes
CREATE INDEX idx_matter_tasks_matter_id ON matter_tasks(matter_id);
CREATE INDEX idx_matter_tasks_assigned_to ON matter_tasks(assigned_to);
CREATE INDEX idx_matter_tasks_status ON matter_tasks(status);
CREATE INDEX idx_matter_tasks_stage ON matter_tasks(stage);
CREATE INDEX idx_matter_task_history_task_id ON matter_task_history(task_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for matter_tasks
CREATE TRIGGER update_matter_tasks_updated_at
    BEFORE UPDATE ON matter_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE matter_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_task_history ENABLE ROW LEVEL SECURITY;

-- Matter tasks policies
CREATE POLICY "Users can view tasks for matters they have access to"
    ON matter_tasks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM matter_team
            WHERE matter_team.matter_id = matter_tasks.matter_id
            AND matter_team.profile_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert tasks for matters they have access to"
    ON matter_tasks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM matter_team
            WHERE matter_team.matter_id = matter_tasks.matter_id
            AND matter_team.profile_id = auth.uid()
        )
    );

CREATE POLICY "Users can update tasks for matters they have access to"
    ON matter_tasks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM matter_team
            WHERE matter_team.matter_id = matter_tasks.matter_id
            AND matter_team.profile_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete tasks for matters they have access to"
    ON matter_tasks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM matter_team
            WHERE matter_team.matter_id = matter_tasks.matter_id
            AND matter_team.profile_id = auth.uid()
        )
    );

-- Matter task history policies
CREATE POLICY "Users can view task history for matters they have access to"
    ON matter_task_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM matter_tasks
            JOIN matter_team ON matter_team.matter_id = matter_tasks.matter_id
            WHERE matter_tasks.id = matter_task_history.task_id
            AND matter_team.profile_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert task history for matters they have access to"
    ON matter_task_history FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM matter_tasks
            JOIN matter_team ON matter_team.matter_id = matter_tasks.matter_id
            WHERE matter_tasks.id = matter_task_history.task_id
            AND matter_team.profile_id = auth.uid()
        )
    ); 