import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Initialize Supabase client
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

async function runQuery(query) {
    const { data, error } = await supabase.rpc('exec_sql', { query });
    if (error) throw error;
    return data;
}

async function verifyDatabaseSetup() {
    try {
        console.log('🔍 Verifying database setup...\n');

        // 1. Check trigger setup
        console.log('1. Checking trigger setup...');
        const triggerCheck = await runQuery(fs.readFileSync(path.join(process.cwd(), 'check-trigger.sql'), 'utf8'));
        console.log('Trigger check results:', JSON.stringify(triggerCheck, null, 2), '\n');

        // 2. Check recent users and profiles
        console.log('2. Checking recent users and profiles...');
        const profileCheck = await runQuery(fs.readFileSync(path.join(process.cwd(), 'check-profiles.sql'), 'utf8'));
        console.log('Profile check results:', JSON.stringify(profileCheck, null, 2), '\n');

        // 3. Test trigger with a new user
        console.log('3. Testing trigger with a new user...');
        const triggerTest = await runQuery(fs.readFileSync(path.join(process.cwd(), 'test-trigger.sql'), 'utf8'));
        console.log('Trigger test results:', JSON.stringify(triggerTest, null, 2), '\n');

        // 4. Summary
        console.log('📊 Summary:');
        const hasTrigger = triggerCheck[0]?.trigger_name === 'on_auth_user_created';
        const hasFunction = triggerCheck[1]?.routine_name === 'handle_new_user';
        const hasProfiles = profileCheck[1]?.length > 0;
        const triggerWorks = triggerTest[1]?.length > 0;

        console.log('✅ Trigger exists:', hasTrigger);
        console.log('✅ Trigger function exists:', hasFunction);
        console.log('✅ Profiles exist:', hasProfiles);
        console.log('✅ Trigger works:', triggerWorks);

        if (!hasTrigger || !hasFunction || !hasProfiles || !triggerWorks) {
            console.error('\n❌ Some checks failed. Please review the results above.');
            process.exit(1);
        }

        console.log('\n✅ All checks passed! The database is properly set up for automatic profile creation.');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

verifyDatabaseSetup(); 