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

    // Use Clerk ID directly as profile ID
    const profileId = userId;
    console.log('API route: Using Clerk ID as profile ID:', profileId);

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

    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('API route: Error checking profile:', profileError);
      return NextResponse.json(
        { 
          success: false,
          error: "Failed to check profile", 
          details: profileError.message 
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
          id: profileId,
          user_id: profileId,
          clerk_id: userId,
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
          role_id: role,
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
          profile_id: profileId,
          country: entry.country,
          state: entry.state || null,
          professional_id: entry.id || null,
          year_issued: entry.yearIssued ? parseInt(entry.yearIssued) : null,
          // verification_status field removed
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
        try {
        // Always create a default professional_ids row if none provided
          console.log('API route: Creating default professional ID record');
          const { error: defaultProfIdError } = await supabase
          .from('professional_ids')
          .insert({
            profile_id: newProfile.id,
            country: '',
              // Only include essential fields
            no_id: false
          });
          
          if (defaultProfIdError) {
            console.error('API route: Error creating default professional ID:', defaultProfIdError);
            // Continue despite error - not critical for onboarding
          } else {
            console.log('API route: Successfully created default professional ID');
          }
        } catch (error) {
          console.error('API route: Unexpected error creating default professional ID:', error);
          // Continue despite error
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

    // --- PROFESSIONAL IDS LOGIC ---
    if (professionalIds && Array.isArray(professionalIds)) {
      console.log('API route: Processing professional IDs update:', {
        hasProfessionalIds: true,
        isArray: true,
        length: professionalIds.length,
        data: JSON.stringify(professionalIds, null, 2),
        clerkId: userId
      });

      // Delete existing professional IDs for this user
      const { error: deleteError } = await supabase
        .from('professional_ids')
        .delete()
        .eq('profile_id', profileId);

      if (deleteError) {
        console.error('API route: Error deleting existing professional IDs:', deleteError);
      }

      // Insert new professional IDs
      try {
        // Create simplified professional ID objects to avoid schema issues
        const profIdRows = professionalIds.map((entry: any) => {
          // Only include essential fields
          return {
        profile_id: profileId,
            country: entry.country || '',
        state: entry.state || null,
        professional_id: entry.id || null,
        year_issued: entry.yearIssued ? parseInt(entry.yearIssued) : null,
        no_id: !!entry.noId
          };
        });
        
        console.log('API route: Prepared professional IDs for insertion:', profIdRows);
        
      if (profIdRows.length > 0) {
          // Try insertion with verbose error logging
          const { data: insertData, error: profIdInsertError } = await supabase
          .from('professional_ids')
            .insert(profIdRows)
            .select();
            
        if (profIdInsertError) {
            console.error('API route: Error inserting professional IDs:', {
              message: profIdInsertError.message,
              code: profIdInsertError.code,
              details: profIdInsertError.details,
              hint: profIdInsertError.hint
            });
            
            // Instead of failing, continue with the profile update
            console.warn('API route: Continuing despite professional IDs error');
          } else {
            console.log('API route: Successfully inserted professional IDs:', insertData);
          }
        }
      } catch (error) {
        // Log but don't fail
        console.error('API route: Error in professional IDs update:', error);
        console.warn('API route: Continuing despite error');
      }
    }

    // --- FIRM/SOLO ONBOARDING LOGIC ---
    let firmId = null;
    let isSolo = false;
    let isOwner = false;
    if (role === 'admin' && (body.is_owner || body.is_solo === false)) {
      // FIRM ONBOARDING
      isOwner = true;
      // Try to find existing firm by name
      if (firmName) {
        const { data: existingFirm } = await supabase
          .from('firms')
          .select('id')
          .eq('name', firmName)
          .single();
        if (existingFirm) {
          firmId = existingFirm.id;
        } else {
          // Create new firm
          const { data: newFirm, error: firmError } = await supabase
            .from('firms')
            .insert({
              name: firmName,
              contact_email: email || clerkUser.emailAddresses[0]?.emailAddress || null,
              created_by: userId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
          if (firmError) {
            console.error('API route: Error creating firm:', firmError);
            // Not fatal, continue with profile update
          } else {
            firmId = newFirm.id;
            console.log('API route: Firm created:', newFirm);
          }
        }
      }
      // Create or update firm_users record
      if (firmId) {
        const { data: existingFirmUser } = await supabase
          .from('firm_users')
          .select('id')
          .eq('firm_id', firmId)
          .eq('user_id', profileId)
          .single();
        if (!existingFirmUser) {
          const { error: firmUserError } = await supabase
            .from('firm_users')
            .insert({
              firm_id: firmId,
              user_id: profileId,
              role_id: role,
              is_owner: true,
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          if (firmUserError) {
            console.error('API route: Error creating firm_users record:', firmUserError);
          }
        }
      }
    } else if (body.is_solo === true || role === 'attorney') {
      // SOLO PRACTITIONER
      isSolo = true;
      firmId = null;
    }
    // --- END FIRM/SOLO LOGIC ---

    // Enforce that only admins can assign privileged roles
    const privilegedRoles = ['admin', 'partner', 'managing partner', 'Managing Partner', 'Partner / Equity Partner'];
    if (privilegedRoles.includes(role)) {
      // Fetch current user's role
      const { data: currentProfile, error: currentProfileError } = await supabase
        .from('profiles')
        .select('role_id, roles:role_id(name)')
        .eq('clerk_id', userId)
        .single();
      if (currentProfileError || !currentProfile || !currentProfile.roles || currentProfile.roles[0]?.name !== 'admin') {
        return NextResponse.json({ success: false, error: 'Only admins can assign privileged roles' }, { status: 403 });
      }
    }

    // Fetch the role_id for the provided role name (default to 'attorney')
    let role_id = null;
    try {
      const roleName = body.role || 'attorney';
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleName)
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
        role_id: role_id,
        onboarding_completed: onboarding_completed,
        updated_at: new Date().toISOString(),
        firm_id: firmId,
        is_solo: isSolo
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