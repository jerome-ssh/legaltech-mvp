-- Fix profile ID types and references
BEGIN;

-- First, ensure all profile IDs are valid UUIDs
UPDATE profiles
SET id = gen_random_uuid()
WHERE id IS NULL OR NOT id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Change profile ID type to UUID
ALTER TABLE profiles
ALTER COLUMN id TYPE UUID USING id::uuid;

-- Update references in other tables
ALTER TABLE clients
ALTER COLUMN profile_id TYPE UUID USING profile_id::uuid;

ALTER TABLE cases
ALTER COLUMN profile_id TYPE UUID USING profile_id::uuid;

ALTER TABLE tasks
ALTER COLUMN profile_id TYPE UUID USING profile_id::uuid;

ALTER TABLE user_activities
ALTER COLUMN profile_id TYPE UUID USING profile_id::uuid;

ALTER TABLE user_metrics
ALTER COLUMN profile_id TYPE UUID USING profile_id::uuid;

ALTER TABLE workflow_optimizations
ALTER COLUMN profile_id TYPE UUID USING profile_id::uuid;

ALTER TABLE ai_interactions
ALTER COLUMN profile_id TYPE UUID USING profile_id::uuid;

ALTER TABLE client_feedback
ALTER COLUMN profile_id TYPE UUID USING profile_id::uuid;

ALTER TABLE connections
ALTER COLUMN profile_id TYPE UUID USING profile_id::uuid;

ALTER TABLE documents
ALTER COLUMN profile_id TYPE UUID USING profile_id::uuid;

-- Add foreign key constraints
ALTER TABLE clients
ADD CONSTRAINT fk_clients_profile
FOREIGN KEY (profile_id) REFERENCES profiles(id);

ALTER TABLE cases
ADD CONSTRAINT fk_cases_profile
FOREIGN KEY (profile_id) REFERENCES profiles(id);

ALTER TABLE tasks
ADD CONSTRAINT fk_tasks_profile
FOREIGN KEY (profile_id) REFERENCES profiles(id);

ALTER TABLE user_activities
ADD CONSTRAINT fk_user_activities_profile
FOREIGN KEY (profile_id) REFERENCES profiles(id);

ALTER TABLE user_metrics
ADD CONSTRAINT fk_user_metrics_profile
FOREIGN KEY (profile_id) REFERENCES profiles(id);

ALTER TABLE workflow_optimizations
ADD CONSTRAINT fk_workflow_optimizations_profile
FOREIGN KEY (profile_id) REFERENCES profiles(id);

ALTER TABLE ai_interactions
ADD CONSTRAINT fk_ai_interactions_profile
FOREIGN KEY (profile_id) REFERENCES profiles(id);

ALTER TABLE client_feedback
ADD CONSTRAINT fk_client_feedback_profile
FOREIGN KEY (profile_id) REFERENCES profiles(id);

ALTER TABLE connections
ADD CONSTRAINT fk_connections_profile
FOREIGN KEY (profile_id) REFERENCES profiles(id);

ALTER TABLE documents
ADD CONSTRAINT fk_documents_profile
FOREIGN KEY (profile_id) REFERENCES profiles(id);

COMMIT; 