-- Add applied_template_id to matters to track which template has been applied
ALTER TABLE matters ADD COLUMN IF NOT EXISTS applied_template_id integer REFERENCES matter_task_templates(id);

-- Optionally, you can add a comment for clarity
COMMENT ON COLUMN matters.applied_template_id IS 'The ID of the task template applied to this matter, if any.'; 