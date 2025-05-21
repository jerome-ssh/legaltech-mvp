-- Add foreign key constraints to law_firm_associations table if they don't exist
DO $$ 
BEGIN
    -- Add profile_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'law_firm_associations' 
        AND constraint_name = 'law_firm_associations_profile_id_fkey'
    ) THEN
        ALTER TABLE law_firm_associations
            ADD CONSTRAINT law_firm_associations_profile_id_fkey 
            FOREIGN KEY (profile_id) 
            REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;

    -- Add law_firm_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'law_firm_associations' 
        AND constraint_name = 'law_firm_associations_law_firm_id_fkey'
    ) THEN
        ALTER TABLE law_firm_associations
            ADD CONSTRAINT law_firm_associations_law_firm_id_fkey 
            FOREIGN KEY (law_firm_id) 
            REFERENCES law_firms(id) ON DELETE CASCADE;
    END IF;

    -- Add role_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'law_firm_associations' 
        AND constraint_name = 'law_firm_associations_role_id_fkey'
    ) THEN
        ALTER TABLE law_firm_associations
            ADD CONSTRAINT law_firm_associations_role_id_fkey 
            FOREIGN KEY (role_id) 
            REFERENCES roles(id) ON DELETE RESTRICT;
    END IF;

    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'law_firm_associations' 
        AND constraint_name = 'law_firm_associations_profile_id_law_firm_id_key'
    ) THEN
        ALTER TABLE law_firm_associations
            ADD CONSTRAINT law_firm_associations_profile_id_law_firm_id_key 
            UNIQUE (profile_id, law_firm_id);
    END IF;

    -- Add status check constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'law_firm_associations' 
        AND constraint_name = 'law_firm_associations_status_check'
    ) THEN
        ALTER TABLE law_firm_associations
            ADD CONSTRAINT law_firm_associations_status_check 
            CHECK (status IN ('active', 'inactive', 'pending'));
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE law_firm_associations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'law_firm_associations' 
        AND policyname = 'Users can view their own firm associations'
    ) THEN
        CREATE POLICY "Users can view their own firm associations"
            ON law_firm_associations FOR SELECT
            USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'law_firm_associations' 
        AND policyname = 'Users can manage their own firm associations'
    ) THEN
        CREATE POLICY "Users can manage their own firm associations"
            ON law_firm_associations FOR ALL
            USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
    END IF;
END $$; 