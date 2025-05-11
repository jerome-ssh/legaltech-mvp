import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug logging
console.log('Environment Variables Debug:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Not Set');

// Log environment variables (without sensitive values)
console.log('Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('Supabase Anon Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing');

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required Supabase environment variables');
  throw new Error('Missing required Supabase environment variables');
}

// Create a client for client-side operations (using anon key)
export const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string);

// Create an admin client for server-side operations (using service role key)
export const createServerSupabaseClient = () => {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_KEY environment variable');
  }

  return createClient(supabaseUrl as string, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

// Function to get an authenticated Supabase client using Clerk's JWT
export async function getAuthenticatedSupabase() {
  const { getToken } = auth();
  const token = await getToken({ template: 'supabase' });

  if (!token) {
    throw new Error('No token available');
  }

  return createClient(supabaseUrl as string, supabaseAnonKey as string, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
} 