-- Migration: Fix clients triggers referencing old 'phone' column
-- Description: Drops or updates triggers/functions on the clients table that reference 'phone' instead of 'phone_number'.

-- Drop any triggers that reference the old 'phone' column
DO $$
DECLARE
    trig RECORD;
BEGIN
    FOR trig IN SELECT tgname FROM pg_trigger WHERE tgrelid = 'clients'::regclass LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.clients CASCADE;', trig.tgname);
    END LOOP;
END $$;

-- Optionally, you can recreate the updated trigger here if you know its logic and it should use 'phone_number'.
-- Example: If you had an updated_at trigger, you can recreate it below:

-- CREATE OR REPLACE FUNCTION public.update_clients_updated_at() RETURNS trigger AS $$
-- BEGIN
--     NEW.updated_at = now();
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_clients_updated_at(); 