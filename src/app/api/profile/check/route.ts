import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

    // Check if profile exists in Supabase
    console.log('API route: Checking for existing profile with Clerk ID:', userId);
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('id, onboarding_completed, clerk_id')
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

    // If profile does not exist, create it with sensible defaults
    if (!profile) {
      console.log('API route: No profile found, creating new profile for Clerk ID:', userId);
      // Fetch Clerk user data for required fields
      let email = null;
      let first_name = null;
      let last_name = null;
      let phone_number = null;
      try {
        if (process.env.CLERK_SECRET_KEY) {
          const clerkRes = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
            headers: {
              Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
          });
          if (clerkRes.ok) {
            const userData = await clerkRes.json();
            email = userData.email_addresses?.[0]?.email_address || userData.primary_email_address?.email_address || userData.email_address || null;
            first_name = userData.first_name || null;
            last_name = userData.last_name || null;
            phone_number = userData.phone_numbers?.[0]?.phone_number || null;
          } else {
            throw new Error(`Clerk API returned ${clerkRes.status}`);
          }
        } else {
          throw new Error('CLERK_SECRET_KEY not set');
        }
      } catch (err) {
        console.error('API route: Error fetching Clerk user data:', err);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to fetch Clerk user data',
            details: err instanceof Error ? err.message : 'Unknown error',
          },
          { status: 500 }
        );
      }

      // Fetch the role_id for 'attorney'
      let role_id = null;
      try {
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('id')
          .eq('name', 'attorney')
          .single();
        if (roleError || !roleData) {
          throw new Error(roleError?.message || 'Role not found');
        }
        role_id = roleData.id;
      } catch (err) {
        console.error('API route: Error fetching role_id:', err);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to fetch role_id',
            details: err instanceof Error ? err.message : 'Unknown error',
          },
          { status: 500 }
        );
      }

      // Create the profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          user_id: userId,
          clerk_id: userId,
          email,
          first_name,
          last_name,
          phone_number,
          role_id,
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id, onboarding_completed, clerk_id')
        .single();

      if (createError) {
        console.error('API route: Error creating profile:', createError);
        // If the error is due to a duplicate email, try to update the existing profile
        if (createError.code === '23505' && createError.message.includes('email')) {
          console.log('API route: Email already exists, updating existing profile');
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({
              clerk_id: userId,
              user_id: userId,
              first_name,
              last_name,
              phone_number,
              role_id,
              updated_at: new Date().toISOString()
            })
            .eq('clerk_id', userId)
            .select('id, onboarding_completed, clerk_id')
            .single();

          if (updateError) {
            console.error('API route: Error updating existing profile:', updateError);
            return NextResponse.json(
              { 
                success: false,
                error: "Failed to update profile", 
                details: updateError.message 
              },
              { status: 500 }
            );
          }
          profile = updatedProfile;
        } else {
          return NextResponse.json(
            { 
              success: false,
              error: "Failed to create profile", 
              details: createError.message 
            },
            { status: 500 }
          );
        }
      } else {
        profile = newProfile;
      }
    }

    // Fetch the full profile data if it exists
    if (profile) {
      const { data: fullProfile, error: fullProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('clerk_id', userId)
        .single();
      
      if (fullProfileError) {
        console.error('API route: Error fetching full profile:', fullProfileError);
        return NextResponse.json(
          { 
            success: false,
            error: "Failed to fetch full profile", 
            details: fullProfileError.message 
          },
          { status: 500 }
        );
      }
      
      profile = fullProfile;
    }

    // Return whether profile exists and onboarding status
    console.log('API route: Profile check result:', { 
      exists: !!profile,
      onboarding_completed: profile?.onboarding_completed || false 
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