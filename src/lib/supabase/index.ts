import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { AppError } from '../errors';

// Base configuration for all clients
const baseConfig = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
};

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new AppError('Missing required Supabase environment variables', 'CONFIG_ERROR', 500);
}

// Create a single instance for unauthenticated requests
export const supabase = createClient<Database>(
  supabaseUrl as string,
  supabaseAnonKey as string,
  baseConfig
);

type GetTokenFunction = (options?: { template?: string }) => Promise<string | null>;

// Function to create an authenticated client
export async function createAuthenticatedClient(getToken: GetTokenFunction) {
  try {
    console.log('Getting authentication token...');
    const token = await getToken();
    
    if (!token) {
      console.error('No authentication token available');
      throw new AppError('No authentication token available', 'AUTH_TOKEN_MISSING', 401);
    }

    // Get the JWT token from Clerk
    const jwt = await getToken({ template: 'supabase' });
    
    if (!jwt) {
      console.error('No JWT token available from Clerk');
      throw new AppError('No JWT token available', 'JWT_TOKEN_MISSING', 401);
    }
    
    console.log('Creating authenticated Supabase client with URL:', supabaseUrl);
    const client = createClient<Database>(
      supabaseUrl as string,
      supabaseAnonKey as string,
      {
        ...baseConfig,
        global: {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        },
      }
    );
    
    // Test the connection
    console.log('Testing Supabase connection...');
    const { error: testError } = await client.from('clients').select('count').limit(1);
    
    if (testError) {
      console.error('Supabase connection test failed:', testError);
      throw new AppError(`Failed to connect to Supabase: ${testError.message}`, 'DB_CONNECTION_ERROR', 503);
    }
    
    console.log('Supabase client created and tested successfully');
    return client;
  } catch (error) {
    console.error('Error in createAuthenticatedClient:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create authenticated client',
      'CLIENT_CREATION_ERROR',
      500
    );
  }
}

// Admin client for server-side operations
export function createAdminClient() {
  if (!supabaseServiceKey) {
    throw new AppError('Missing SUPABASE_SERVICE_ROLE_KEY', 'CONFIG_ERROR', 500);
  }
  return createClient<Database>(
    supabaseUrl as string,
    supabaseServiceKey as string,
    baseConfig
  );
}

// Helper function to handle Supabase responses
export async function handleSupabaseResponse<T>(promise: Promise<{ data: T | null; error: any }>) {
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
} 