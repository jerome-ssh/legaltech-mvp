import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { clerkClient } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import type { GetToken } from '@clerk/types';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single instance of the Supabase client for unauthenticated requests
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Function to create an authenticated Supabase client with a JWT
export const getAuthenticatedSupabase = async (getToken: GetToken) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    return null;
  }

  try {
    // Get the JWT from Clerk
    const token = await getToken({ template: "supabase" });
    if (!token) {
      console.error('No JWT token available from Clerk');
      return null;
    }

    console.log('Creating authenticated Supabase client with JWT');
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
}); 
  } catch (error) {
    console.error('Error creating authenticated Supabase client:', error);
    return null;
  }
};

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  
  if (error.code === 'PGRST301') {
    throw new Error('Database connection error. Please try again later.');
  }
  
  if (error.code === '23505') {
    throw new Error('A record with this data already exists.');
  }
  
  if (error.code === '23503') {
    throw new Error('Referenced record does not exist.');
  }
  
  throw new Error(error.message || 'An unexpected error occurred.');
};

// Helper function to handle Supabase responses
export const handleSupabaseResponse = async <T>(
  promise: Promise<{ data: T | null; error: any }>
): Promise<T> => {
  const { data, error } = await promise;
  
  if (error) {
    handleSupabaseError(error);
  }
  
  if (!data) {
    throw new Error('No data returned from the database.');
  }
  
  return data;
}; 