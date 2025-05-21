-- Drop existing views if they exist
DROP VIEW IF EXISTS active_matter_team;
DROP VIEW IF EXISTS matter_team_leads;
DROP VIEW IF EXISTS matter_billing_attorneys;
DROP VIEW IF EXISTS matter_responsible_attorneys;
DROP VIEW IF EXISTS matter_team_history;

-- Create view for active matter team members with their roles and profiles
CREATE OR REPLACE VIEW active_matter_team WITH (security_barrier = true) AS
SELECT 
    mt.id,
    mt.matter_id,
    c.title as case_title,
    c.description as case_description,
    c.status as case_status,
    c.priority as case_priority,
    mt.profile_id,
    p.first_name,
    p.last_name,
    p.email,
    r.id as role_id,
    r.name as role_name,
    r.role_level,
    mt.is_lead,
    mt.is_billing_attorney,
    mt.is_responsible_attorney,
    mt.start_date,
    mt.end_date,
    mt.status,
    mt.notes,
    mt.created_at,
    mt.updated_at
FROM matter_team mt
JOIN cases c ON mt.matter_id = c.id
JOIN profiles p ON mt.profile_id = p.id
JOIN roles r ON mt.role_id = r.id
WHERE mt.status = 'active'
AND (mt.end_date IS NULL OR mt.end_date >= CURRENT_DATE);

-- Create view for matter team leads
CREATE OR REPLACE VIEW matter_team_leads WITH (security_barrier = true) AS
SELECT 
    mt.id,
    mt.matter_id,
    c.title as case_title,
    c.description as case_description,
    c.status as case_status,
    c.priority as case_priority,
    mt.profile_id,
    p.first_name,
    p.last_name,
    p.email,
    r.name as role_name,
    mt.start_date,
    mt.end_date,
    mt.status
FROM matter_team mt
JOIN cases c ON mt.matter_id = c.id
JOIN profiles p ON mt.profile_id = p.id
JOIN roles r ON mt.role_id = r.id
WHERE mt.is_lead = true
AND mt.status = 'active'
AND (mt.end_date IS NULL OR mt.end_date >= CURRENT_DATE);

-- Create view for matter billing attorneys
CREATE OR REPLACE VIEW matter_billing_attorneys WITH (security_barrier = true) AS
SELECT 
    mt.id,
    mt.matter_id,
    c.title as case_title,
    c.description as case_description,
    c.status as case_status,
    c.priority as case_priority,
    mt.profile_id,
    p.first_name,
    p.last_name,
    p.email,
    r.name as role_name,
    mt.start_date,
    mt.end_date,
    mt.status
FROM matter_team mt
JOIN cases c ON mt.matter_id = c.id
JOIN profiles p ON mt.profile_id = p.id
JOIN roles r ON mt.role_id = r.id
WHERE mt.is_billing_attorney = true
AND mt.status = 'active'
AND (mt.end_date IS NULL OR mt.end_date >= CURRENT_DATE);

-- Create view for matter responsible attorneys
CREATE OR REPLACE VIEW matter_responsible_attorneys WITH (security_barrier = true) AS
SELECT 
    mt.id,
    mt.matter_id,
    c.title as case_title,
    c.description as case_description,
    c.status as case_status,
    c.priority as case_priority,
    mt.profile_id,
    p.first_name,
    p.last_name,
    p.email,
    r.name as role_name,
    mt.start_date,
    mt.end_date,
    mt.status
FROM matter_team mt
JOIN cases c ON mt.matter_id = c.id
JOIN profiles p ON mt.profile_id = p.id
JOIN roles r ON mt.role_id = r.id
WHERE mt.is_responsible_attorney = true
AND mt.status = 'active'
AND (mt.end_date IS NULL OR mt.end_date >= CURRENT_DATE);

-- Create view for matter team history
CREATE OR REPLACE VIEW matter_team_history WITH (security_barrier = true) AS
SELECT 
    mt.id,
    mt.matter_id,
    c.title as case_title,
    c.description as case_description,
    c.status as case_status,
    c.priority as case_priority,
    mt.profile_id,
    p.first_name,
    p.last_name,
    p.email,
    r.name as role_name,
    mt.is_lead,
    mt.is_billing_attorney,
    mt.is_responsible_attorney,
    mt.start_date,
    mt.end_date,
    mt.status,
    mt.notes,
    mt.created_at,
    mt.updated_at,
    CASE 
        WHEN mt.end_date IS NULL THEN 'Current'
        WHEN mt.end_date < CURRENT_DATE THEN 'Past'
        ELSE 'Future'
    END as team_member_status
FROM matter_team mt
JOIN cases c ON mt.matter_id = c.id
JOIN profiles p ON mt.profile_id = p.id
JOIN roles r ON mt.role_id = r.id;

-- Add comments to views
COMMENT ON VIEW active_matter_team IS 'Shows all active team members for matters with their roles and profile information';
COMMENT ON VIEW matter_team_leads IS 'Shows all matter leads with their profile information';
COMMENT ON VIEW matter_billing_attorneys IS 'Shows all billing attorneys for matters with their profile information';
COMMENT ON VIEW matter_responsible_attorneys IS 'Shows all responsible attorneys for matters with their profile information';
COMMENT ON VIEW matter_team_history IS 'Shows complete history of team members for matters, including past and future assignments';

-- Enable Row Level Security on views
ALTER VIEW active_matter_team SET (security_barrier = on);
ALTER VIEW matter_team_leads SET (security_barrier = on);
ALTER VIEW matter_billing_attorneys SET (security_barrier = on);
ALTER VIEW matter_responsible_attorneys SET (security_barrier = on);
ALTER VIEW matter_team_history SET (security_barrier = on); 