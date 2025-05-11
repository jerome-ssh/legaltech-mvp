-- First, clean up any duplicate entries by keeping only the most recent one for each profile
WITH ranked_entries AS (
    SELECT 
        id,
        profile_id,
        ROW_NUMBER() OVER (PARTITION BY profile_id ORDER BY created_at DESC) as rn
    FROM professional_ids
)
DELETE FROM professional_ids
WHERE id IN (
    SELECT id 
    FROM ranked_entries 
    WHERE rn > 1
);

-- Add unique constraint on profile_id
ALTER TABLE professional_ids
ADD CONSTRAINT unique_profile_professional_id UNIQUE (profile_id);

-- Add a comment to explain the constraint
COMMENT ON CONSTRAINT unique_profile_professional_id ON professional_ids 
IS 'Ensures each profile can only have one professional ID entry';
