import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

// Initialize Supabase client with service role key
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

async function applyConstraint() {
    try {
        console.log('Starting migration to add unique constraint on professional_ids...');

        // First, clean up duplicate entries
        console.log('Cleaning up duplicate entries...');
        const { error: cleanupError } = await supabase.rpc('exec_sql', {
            query: `
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
      `
        });

        if (cleanupError) {
            throw new Error(`Error cleaning up duplicates: ${cleanupError.message}`);
        }

        // Add unique constraint
        console.log('Adding unique constraint...');
        const { error: constraintError } = await supabase.rpc('exec_sql', {
            query: `
        ALTER TABLE professional_ids
        ADD CONSTRAINT unique_profile_professional_id UNIQUE (profile_id);

        COMMENT ON CONSTRAINT unique_profile_professional_id ON professional_ids 
        IS 'Ensures each profile can only have one professional ID entry';
      `
        });

        if (constraintError) {
            throw new Error(`Error adding constraint: ${constraintError.message}`);
        }

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
}

// Run the migration
applyConstraint(); 