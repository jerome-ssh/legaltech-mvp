// Script to backfill Supabase profiles for Clerk users.
//
// Current logic: Sets user_id to the Clerk user ID (user.id) for each profile.
// This is a practical default and can be changed later if your data model evolves.
// If you change your approach, update this script and migrate existing data as needed.

// 1. Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// 2. Then import everything else
import { clerkClient } from '@clerk/clerk-sdk-node'; // Use the node SDK for backend scripts!
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createMissingProfiles() {
  try {
    // Get all users from Clerk
    const response = await clerkClient.users.getUserList();
    const users = response.data;
    console.log(`Found ${users.length} users in Clerk`);

    for (const user of users) {
      // Check if profile exists in Supabase
      const { data: existingProfile, error: lookupError } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      if (lookupError && lookupError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error(`Error looking up profile for user ${user.id}:`, lookupError);
        continue;
      }

      if (existingProfile) {
        console.log(`Profile already exists for user ${user.id}`);
        continue;
      }

      // Create new profile
      // user_id is set to Clerk user ID for now. You can change this logic later if needed.
      const { data: profile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id, // <-- Set to Clerk user ID. Changeable in the future.
          clerk_id: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          first_name: user.firstName,
          last_name: user.lastName,
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error(`Error creating profile for user ${user.id}:`, createError);
        continue;
      }

      console.log(`Created profile for user ${user.id}:`, profile);
    }

    console.log('Finished processing all users');
  } catch (error) {
    console.error('Error in createMissingProfiles:', error);
  }
}

createMissingProfiles(); 