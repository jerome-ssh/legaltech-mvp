-- Fix case table inconsistencies
BEGIN;

-- Fix cases table
ALTER TABLE cases
ALTER COLUMN id TYPE UUID USING id::uuid,
ALTER COLUMN client_id TYPE UUID USING client_id::uuid,
ALTER COLUMN assigned_to TYPE UUID USING assigned_to::uuid,
ALTER COLUMN created_by TYPE UUID USING created_by::uuid;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cases_created_by ON cases(created_by);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);

-- Add missing constraints
ALTER TABLE cases
ADD CONSTRAINT fk_cases_client
FOREIGN KEY (client_id) REFERENCES clients(id),
ADD CONSTRAINT fk_cases_assigned_to
FOREIGN KEY (assigned_to) REFERENCES auth.users(id),
ADD CONSTRAINT fk_cases_created_by
FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- Add missing NOT NULL constraints
ALTER TABLE cases
ALTER COLUMN client_id SET NOT NULL,
ALTER COLUMN created_by SET NOT NULL,
ALTER COLUMN status SET NOT NULL;

-- Add missing timestamps
ALTER TABLE cases
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

CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Fix case_notes table
ALTER TABLE case_notes
ALTER COLUMN id TYPE UUID USING id::uuid,
ALTER COLUMN case_id TYPE UUID USING case_id::uuid,
ALTER COLUMN created_by TYPE UUID USING created_by::uuid;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_case_notes_case_id ON case_notes(case_id);
CREATE INDEX IF NOT EXISTS idx_case_notes_created_by ON case_notes(created_by);

-- Add missing constraints
ALTER TABLE case_notes
ADD CONSTRAINT fk_case_notes_case
FOREIGN KEY (case_id) REFERENCES cases(id),
ADD CONSTRAINT fk_case_notes_created_by
FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- Add missing NOT NULL constraints
ALTER TABLE case_notes
ALTER COLUMN case_id SET NOT NULL,
ALTER COLUMN created_by SET NOT NULL,
ALTER COLUMN content SET NOT NULL;

-- Add missing timestamps
ALTER TABLE case_notes
ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now()),
ALTER COLUMN updated_at SET DEFAULT timezone('utc'::text, now());

CREATE TRIGGER update_case_notes_updated_at
    BEFORE UPDATE ON case_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT; 