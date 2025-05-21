-- Fix task table inconsistencies
BEGIN;

-- Fix tasks table
ALTER TABLE tasks
ALTER COLUMN id TYPE UUID USING id::uuid,
ALTER COLUMN case_id TYPE UUID USING case_id::uuid,
ALTER COLUMN assigned_to TYPE UUID USING assigned_to::uuid,
ALTER COLUMN created_by TYPE UUID USING created_by::uuid;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_tasks_case_id ON tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Add missing constraints
ALTER TABLE tasks
ADD CONSTRAINT fk_tasks_case
FOREIGN KEY (case_id) REFERENCES cases(id),
ADD CONSTRAINT fk_tasks_assigned_to
FOREIGN KEY (assigned_to) REFERENCES auth.users(id),
ADD CONSTRAINT fk_tasks_created_by
FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- Add missing NOT NULL constraints
ALTER TABLE tasks
ALTER COLUMN case_id SET NOT NULL,
ALTER COLUMN created_by SET NOT NULL,
ALTER COLUMN status SET NOT NULL,
ALTER COLUMN priority SET NOT NULL,
ALTER COLUMN title SET NOT NULL;

-- Add missing timestamps
ALTER TABLE tasks
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

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Fix task_comments table
ALTER TABLE task_comments
ALTER COLUMN id TYPE UUID USING id::uuid,
ALTER COLUMN task_id TYPE UUID USING task_id::uuid,
ALTER COLUMN created_by TYPE UUID USING created_by::uuid;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_by ON task_comments(created_by);

-- Add missing constraints
ALTER TABLE task_comments
ADD CONSTRAINT fk_task_comments_task
FOREIGN KEY (task_id) REFERENCES tasks(id),
ADD CONSTRAINT fk_task_comments_created_by
FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- Add missing NOT NULL constraints
ALTER TABLE task_comments
ALTER COLUMN task_id SET NOT NULL,
ALTER COLUMN created_by SET NOT NULL,
ALTER COLUMN content SET NOT NULL;

-- Add missing timestamps
ALTER TABLE task_comments
ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now()),
ALTER COLUMN updated_at SET DEFAULT timezone('utc'::text, now());

CREATE TRIGGER update_task_comments_updated_at
    BEFORE UPDATE ON task_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT; 