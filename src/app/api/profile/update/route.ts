import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs";
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
      professionalIds = []
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
          clerk_id: userId,
          user_id: userId,
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
          user_id: userId,
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
            // Log the first entry in detail
            console.log('API route: First professional ID entry:', {
                raw: professionalIds[0],
                country: professionalIds[0].country,
                state: professionalIds[0].state,
                id: professionalIds[0].id,
                yearIssued: professionalIds[0].yearIssued,
                noId: professionalIds[0].noId
            });

            // Only delete existing records if we have new ones to insert
            console.log('API route: Deleting existing professional IDs for profile:', existingProfile.id);
            const { error: deleteError, count: deleteCount } = await supabase
                .from('professional_ids')
                .delete()
                .eq('profile_id', existingProfile.id)
                .select('count');
            
            console.log('API route: Delete operation result:', { error: deleteError, count: deleteCount });

            // Prepare and insert new professional IDs
            const profIdRows = professionalIds.map((entry: any) => {
                const row = {
                    profile_id: existingProfile.id,
                    country: entry.country,
                    state: entry.state || null,
                    professional_id: entry.id || null,
                    year_issued: entry.yearIssued ? parseInt(entry.yearIssued) : null,
                    verification_status: 'not_verified',
                    no_id: !!entry.noId
                };
                console.log('API route: Prepared row for insertion:', row);
                return row;
            });

            console.log('API route: Attempting to insert professional IDs:', JSON.stringify(profIdRows, null, 2));
            const { data: insertedIds, error: insertError } = await supabase
                .from('professional_ids')
                .insert(profIdRows)
                .select();

            if (insertError) {
                console.error('API route: Error inserting professional IDs:', {
                    error: insertError,
                    code: insertError.code,
                    message: insertError.message,
                    details: insertError.details
                });
            } else {
                console.log('API route: Successfully inserted professional IDs:', {
                    count: insertedIds?.length,
                    firstInserted: insertedIds?.[0],
                    allInserted: insertedIds
                });
            }
        } catch (error) {
            console.error('API route: Unexpected error handling professional IDs:', {
                error,
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
        }
    } else {
        console.log('API route: No professional IDs provided in update, skipping professional IDs update. Details:', {
            professionalIds,
            type: typeof professionalIds,
            isArray: Array.isArray(professionalIds),
            length: professionalIds?.length
        });
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