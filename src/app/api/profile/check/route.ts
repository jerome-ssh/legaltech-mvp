import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required Supabase environment variables');
  throw new Error('Missing required Supabase environment variables');
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  console.log('API route: Starting profile check request');
  
  try {
    const { userId } = auth();
    console.log('API route: Auth check - userId:', userId);

    if (!userId) {
      console.log('API route: No userId found in auth');
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if profile exists in Supabase and get full profile data
    console.log('API route: Checking for existing profile with Clerk ID:', userId);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    // If there's an error and it's not the "no rows found" error, return error
    if (error && error.code !== 'PGRST116') {
      console.error('API route: Error checking profile:', error);
      return NextResponse.json(
        { 
          success: false,
          error: "Failed to check profile", 
          details: error.message 
        },
        { status: 500 }
      );
    }

    // Return whether profile exists, onboarding status, and full profile data
    console.log('API route: Profile check result:', { 
      exists: !!profile,
      onboarding_completed: profile?.onboarding_completed || false,
      profile: profile
    });
    
    return NextResponse.json(
      { 
        success: true,
        exists: !!profile,
        onboarding_completed: profile?.onboarding_completed || false,
        profile: profile
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API route: Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 