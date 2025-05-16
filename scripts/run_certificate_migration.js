import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'migrations', 'add_document_fields_to_professional_ids.sql');
    const migrationSql = readFileSync(migrationPath, 'utf8');

    console.log('Running certificate document fields migration...');
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSql });

    if (error) {
      console.error('Migration failed:', error);
    } else {
      console.log('Migration completed successfully');
    }
  } catch (error) {
    console.error('Error running migration:', error);
  }
}

runMigration(); 