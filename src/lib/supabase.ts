import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const isDevelopment = process.env.NODE_ENV === 'development';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

// Check for both service key variations
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// In development, we can use the anon key if service key is not available
const supabaseKey = isDevelopment 
  ? serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  : serviceKey;

if (!supabaseKey) {
  throw new Error(
    isDevelopment
      ? 'Missing env.SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY'
      : 'Missing env.SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SERVICE_KEY'
  );
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any) {
  console.error('Supabase error:', error);
  if (error.code) {
    console.error('Error code:', error.code);
  }
  if (error.message) {
    console.error('Error message:', error.message);
  }
  if (error.details) {
    console.error('Error details:', error.details);
  }
  return error;
}

export async function getProfileId(userId: string): Promise<string> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    throw new Error('Failed to fetch profile');
  }

  if (!profile) {
    throw new Error('Profile not found');
  }

  return profile.id;
} 