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

    // Update existing profile
    console.log('API route: Updating existing profile for Supabase ID:', existingProfile.id);
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
      .eq('id', existingProfile.id)
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

    // Handle professional IDs update
    console.log('API route: Processing professional IDs update:', {
        hasProfessionalIds: !!professionalIds,
        isArray: Array.isArray(professionalIds),
        length: professionalIds?.length || 0,
        data: JSON.stringify(professionalIds, null, 2),
        profileId: existingProfile.id
    });

    if (professionalIds && Array.isArray(professionalIds) && professionalIds.length > 0) {
        try {
            // Get the first professional ID entry (we only want one per profile)
            const entry = professionalIds[0];
            console.log('API route: Processing professional ID entry:', entry);

            // Check if an entry already exists for this profile
            const { data: existingEntry, error: lookupError } = await supabase
                .from('professional_ids')
                .select('id')
                .eq('profile_id', existingProfile.id)
                .single();

            if (lookupError && lookupError.code !== 'PGRST116') {
                console.error('API route: Error looking up existing professional ID:', lookupError);
            }

            const profIdData = {
                profile_id: existingProfile.id,
                country: entry.country,
                state: entry.state || null,
                professional_id: entry.id || null,
                year_issued: entry.yearIssued ? parseInt(entry.yearIssued) : null,
                verification_status: 'not_verified',
                no_id: !!entry.noId
            };

            if (existingEntry) {
                // Update existing entry
                console.log('API route: Updating existing professional ID entry:', existingEntry.id);
                const { error: updateError } = await supabase
                    .from('professional_ids')
                    .update(profIdData)
                    .eq('id', existingEntry.id);

                if (updateError) {
                    console.error('API route: Error updating professional ID:', updateError);
                } else {
                    console.log('API route: Successfully updated professional ID entry');
                }
            } else {
                // Create new entry
                console.log('API route: Creating new professional ID entry');
                const { error: insertError } = await supabase
                    .from('professional_ids')
                    .insert(profIdData);

                if (insertError) {
                    console.error('API route: Error inserting professional ID:', insertError);
                } else {
                    console.log('API route: Successfully created professional ID entry');
                }
            }
        } catch (error) {
            console.error('API route: Unexpected error handling professional ID:', {
                error,
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
        }
    } else {
        console.log('API route: No professional IDs provided in update, skipping professional IDs update');
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