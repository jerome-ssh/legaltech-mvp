-- Migration: Add Bankruptcy Litigation Task Template
-- Insert the template
WITH new_template AS (
  INSERT INTO matter_task_templates (matter_type_id, sub_type_id, template_name)
  VALUES (13, 116, 'Bankruptcy Litigation - Default Tasks')
  RETURNING id
)
-- Insert tasks for the template
INSERT INTO matter_task_template_items (template_id, label, stage, default_weight, position)
SELECT id, label, stage, default_weight, position FROM new_template, (
  VALUES
    ('Conflict Check', 'Intake', 1, 1),
    ('Client Intake & KYC', 'Intake', 1, 2),
    ('Review Petition and Schedules', 'Planning', 2, 3),
    ('Analyze Claims and Creditors', 'Planning', 2, 4),
    ('Prepare and File Motions', 'Active Work', 2, 5),
    ('Attend 341 Meeting of Creditors', 'Active Work', 2, 6),
    ('Discovery and Evidence Gathering', 'Active Work', 2, 7),
    ('Draft and File Objections', 'Active Work', 2, 8),
    ('Attend Hearings and Court Dates', 'Active Work', 2, 9),
    ('Negotiate Settlements', 'Active Work', 2, 10),
    ('Prepare for Trial', 'Planning', 2, 11),
    ('Post-Trial Motions and Orders', 'Closure', 1, 12),
    ('Close & Archive Matter', 'Closure', 1, 13)
) AS t(label, stage, default_weight, position); 