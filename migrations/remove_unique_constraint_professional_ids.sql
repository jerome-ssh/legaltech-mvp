-- Remove the unique constraint that prevents multiple jurisdiction records per user
ALTER TABLE professional_ids
DROP CONSTRAINT IF EXISTS unique_profile_professional_id; 