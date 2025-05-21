-- Add client_id column to client_feedback if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='client_feedback' AND column_name='client_id'
  ) THEN
    ALTER TABLE client_feedback ADD COLUMN client_id UUID;
  END IF;
END $$; 

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  frequency INTEGER DEFAULT 0,
  is_recurring BOOLEAN DEFAULT false,
  case_id UUID REFERENCES cases(id)
); 