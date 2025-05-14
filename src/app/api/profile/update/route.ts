import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs";
import { createClient } from '@supabase/supabase-js';
import { v5 as uuidv5 } from 'uuid';

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

// Function to convert Clerk ID to UUID
function clerkIdToUUID(clerkId: string): string {
    return uuidv5(clerkId, '6ba7b810-9dad-11d1-80b4-00c04fd430c8');
}

// Helper to determine if user is a social (Google) sign-in
function isSocialSignIn(userData: any): boolean {
  if (!userData) return false;
  if (Array.isArray(userData.externalAccounts) && userData.externalAccounts.length > 0) {
    return userData.externalAccounts.some((acc: any) => acc.provider && acc.provider.startsWith('oauth_'));
  }
  // Fallback for Clerk API v1: external_accounts
  if (Array.isArray(userData.external_accounts) && userData.external_accounts.length > 0) {
    return userData.external_accounts.some((acc: any) => acc.provider && acc.provider.startsWith('oauth_'));
  }
  return false;
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  console.log('API route: Starting profile update request');
  
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

    // Convert Clerk ID to UUID for the profile ID
    const profileId = clerkIdToUUID(userId);
    console.log('API route: Generated profile ID:', profileId);

    // Fetch user data from Clerk
    const clerkUser = await clerkClient.users.getUser(userId);
    console.log('API route: Fetched Clerk user data:', clerkUser);

    let body;
    try {
      body = await request.json();
      console.log('API route: Received request body:', body);
    } catch (parseError) {
      console.error('API route: Failed to parse request body:', parseError);
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid request body",
          details: parseError instanceof Error ? parseError.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

    const { 
      firmName, 
      specialization, 
      yearsOfPractice, 
      avatarUrl, 
      address, 
      homeAddress,
      firstName,
      lastName,
      email,
      phoneNumber,
      gender,
      onboarding_completed = false,
      professionalIds = [],
      role = 'attorney'
    } = body;

    // Check for duplicate phone number if phone number is being updated
    if (phoneNumber && !isSocialSignIn(clerkUser)) {
      const { data: existingPhoneProfile } = await supabase
        .from('profiles')
        .select('clerk_id')
        .eq('phone_number', phoneNumber)
        .neq('clerk_id', userId)
        .single();

      if (existingPhoneProfile) {
        console.log('API route: Phone number already in use by another account');
        return NextResponse.json(
          { 
            success: false,
            error: "Phone number is already associated with another account",
            code: "PHONE_NUMBER_IN_USE"
          },
          { status: 400 }
        );
      }
    }

    // First, get the Supabase user ID from the profiles table
    console.log('API route: Looking up Supabase user ID for Clerk ID:', userId);
    const { data: existingProfile, error: lookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    // Only treat as error if it's not the 'no rows found' error
    if (lookupError && lookupError.code !== 'PGRST116') {
      console.error('API route: Error looking up profile:', lookupError);
      return NextResponse.json(
        { 
          success: false,
          error: "Failed to find user profile", 
          details: lookupError.message 
        },
        { status: 500 }
      );
    }

    if (!existingProfile) {
      console.log('API route: No existing profile found, creating new profile');
      // Create a new profile if one doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: profileId, // Use the generated UUID
          user_id: profileId, // Use the same UUID for user_id
          clerk_id: userId, // Store the original Clerk ID
          email: email || clerkUser.emailAddresses[0]?.emailAddress || null,
          phone_number: phoneNumber || clerkUser.phoneNumbers[0]?.phoneNumber || null,
          first_name: firstName || clerkUser.firstName || null,
          last_name: lastName || clerkUser.lastName || null,
          firm_name: firmName || null,
          specialization: specialization || null,
          years_of_practice: yearsOfPractice || null,
          avatar_url: avatarUrl || null,
          address: address || null,
          home_address: homeAddress || null,
          gender: gender || null,
          role: role,
          onboarding_completed: onboarding_completed,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('API route: Error creating profile:', createError);
        return NextResponse.json(
          { 
            success: false,
            error: "Failed to create profile", 
            details: createError.message 
          },
          { status: 500 }
        );
      }

      // Insert professional IDs for new profile
      if (professionalIds && Array.isArray(professionalIds) && professionalIds.length > 0) {
        const profIdRows = professionalIds.map((entry: any) => ({
          user_id: profileId,
          country: entry.country,
          state: entry.state || null,
          professional_id: entry.id || null,
          year_issued: entry.yearIssued ? parseInt(entry.yearIssued) : null,
          verification_status: 'not_verified',
          no_id: !!entry.noId
        }));
        const { error: profIdInsertError } = await supabase
          .from('professional_ids')
          .insert(profIdRows);
        if (profIdInsertError) {
          console.error('API route: Error inserting professional IDs:', profIdInsertError);
          // Not fatal, but log it
        }
      } else {
        // Always create a default professional_ids row if none provided
        await supabase
          .from('professional_ids')
          .insert({
            profile_id: newProfile.id,
            country: '',
            state: '',
            professional_id: '',
            year_issued: null,
            verification_status: 'not_verified',
            no_id: false
          });
      }

      console.log('API route: Profile created successfully:', newProfile);
      return NextResponse.json(
        { 
          success: true,
          profile: newProfile 
        },
        { status: 200 }
      );
    }

    // Process professional IDs if provided
    if (professionalIds && Array.isArray(professionalIds)) {
      console.log('API route: Processing professional IDs update:', {
        hasProfessionalIds: true,
        isArray: true,
        length: professionalIds.length,
        data: JSON.stringify(professionalIds, null, 2),
        clerkId: userId
      });

      // Get the UUID for the user
      const profileId = clerkIdToUUID(userId);

      // Delete existing professional IDs for this user
      const { error: deleteError } = await supabase
        .from('professional_ids')
        .delete()
        .eq('user_id', profileId);

      if (deleteError) {
        console.error('API route: Error deleting existing professional IDs:', deleteError);
      }

      // Insert new professional IDs
      for (const entry of professionalIds) {
        console.log('API route: Processing professional ID entry:', entry);
        
        if (entry.noId || entry.id) {
          const { error: insertError } = await supabase
            .from('professional_ids')
            .insert({
              user_id: profileId,
              country: entry.country,
              state: entry.state || null,
              id: entry.id || null,
              year_issued: entry.yearIssued || null,
              no_id: entry.noId
            });

          if (insertError) {
            console.error('API route: Error inserting professional ID:', insertError);
          }
        }
      }
    }

    // Update existing profile
    console.log('API route: Updating existing profile for Clerk ID:', userId);
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        email: email || clerkUser.emailAddresses[0]?.emailAddress || null,
        phone_number: phoneNumber || clerkUser.phoneNumbers[0]?.phoneNumber || null,
        first_name: firstName || clerkUser.firstName || null,
        last_name: lastName || clerkUser.lastName || null,
        firm_name: firmName || null,
        specialization: specialization || null,
        years_of_practice: yearsOfPractice || null,
        avatar_url: avatarUrl || null,
        address: address || null,
        home_address: homeAddress || null,
        gender: gender || null,
        role: role,
        onboarding_completed: onboarding_completed,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('API route: Error updating profile:', updateError);
      return NextResponse.json(
        { 
          success: false,
          error: "Failed to update profile", 
          details: updateError.message 
        },
        { status: 500 }
      );
    }

    console.log('API route: Profile updated successfully:', updatedProfile);
    return NextResponse.json(
      { 
        success: true,
        profile: updatedProfile 
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