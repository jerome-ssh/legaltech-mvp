import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { AppError } from './errors';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Base client configuration
const baseConfig = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
};

// Create a single instance for unauthenticated requests
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, baseConfig);

// Function to create an authenticated client
export const createAuthenticatedClient = async (getToken: () => Promise<string | null>) => {
  const token = await getToken();
    if (!token) {
    throw new AppError('No authentication token available', 'AUTH_TOKEN_MISSING', 401);
  }
  
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    ...baseConfig,
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
}); 
};

// Admin client for server-side operations
export const createAdminClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new AppError('Missing SUPABASE_SERVICE_ROLE_KEY', 'CONFIG_ERROR', 500);
  }
  
  return createClient<Database>(supabaseUrl, serviceKey, baseConfig);
};

// Helper function to handle Supabase responses
export const handleSupabaseResponse = async <T>(promise: Promise<{ data: T | null; error: any }>) => {
  const { data, error } = await promise;
  
  if (error) {
    console.error('Supabase error:', error);
    
    // Map common Supabase error codes to user-friendly messages
    switch (error.code) {
      case 'PGRST301':
        throw new AppError('Database connection error. Please try again later.', 'DB_CONNECTION_ERROR', 503);
      case '23505':
        throw new AppError('A record with this data already exists.', 'DUPLICATE_RECORD', 409);
      case '23503':
        throw new AppError('Referenced record does not exist.', 'REFERENCE_ERROR', 404);
      default:
        throw new AppError(error.message || 'An unexpected error occurred.', 'UNKNOWN_ERROR', 500);
    }
  }
  
  if (!data) {
    throw new AppError('No data returned from the database.', 'NO_DATA', 404);
  }
  
  return data;
}; 