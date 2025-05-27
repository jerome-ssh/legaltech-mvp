-- Migration: Add client_id foreign key to matters table
-- Adds a foreign key constraint from matters.client_id to clients.id if not already present

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_matters_client_id'
      AND table_name = 'matters'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE public.matters
    ADD CONSTRAINT fk_matters_client_id
    FOREIGN KEY (client_id) REFERENCES public.clients(id);
  END IF;
END$$; 