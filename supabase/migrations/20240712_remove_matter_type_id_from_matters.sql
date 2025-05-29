-- Migration: Remove redundant matter_type_id from matters
ALTER TABLE matters
  DROP CONSTRAINT IF EXISTS matters_matter_type_id_fkey,
  DROP COLUMN IF EXISTS matter_type_id; 