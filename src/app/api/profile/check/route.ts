import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { clerkClient } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { AppError, ErrorCodes, createResponse, createErrorResponse } from '@/lib/error-handling';
import { MAX_RETRIES, RETRY_DELAY } from '@/lib/constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  console.log('API route: Starting profile check request');
  
  try {
    const { userId } = auth();
    if (!userId) {
      return createErrorResponse('Unauthorized', 401, ErrorCodes.AUTH.UNAUTHORIZED);
    }

    // Fetch user data from Clerk with retry logic
    let clerkUser;
    let retryCount = 0;

    while (retryCount < MAX_RETRIES) {
      try {
        clerkUser = await clerkClient.users.getUser(userId);
        break;
      } catch (err) {
        console.error('API route: Error fetching Clerk user data, attempt', retryCount + 1, err);
        if (retryCount < MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          retryCount++;
        } else {
          throw new AppError(
            'Failed to fetch Clerk user data',
            ErrorCodes.AUTH.TOKEN_INVALID,
            500
          );
        }
      }
    }

    if (!clerkUser) {
      throw new AppError(
        "Failed to fetch Clerk user data",
        ErrorCodes.AUTH.TOKEN_INVALID,
        500
      );
    }

    // Check if profile exists in Supabase with retry logic
    retryCount = 0;
    while (retryCount < MAX_RETRIES) {
      try {
        // First get the profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id,
            onboarding_completed,
            clerk_id,
            email,
            first_name,
            last_name,
            phone_number,
            role_id,
            firm_name,
            specialization,
            years_of_practice,
            avatar_url,
            address,
            home_address,
            gender,
            created_at,
            updated_at
          `)
          .eq('clerk_id', userId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw new AppError(
            "Failed to check profile",
            ErrorCodes.DATABASE.CONNECTION_ERROR,
            500
          );
        }

        if (profile) {
          // Get professional IDs for this profile
          const { data: professionalIds, error: professionalIdsError } = await supabase
            .from('professional_ids')
            .select('*')
            .eq('profile_id', profile.id);

          if (professionalIdsError) {
            console.error('Error fetching professional IDs:', professionalIdsError);
            // Don't throw error, just return empty array
            return createResponse({
              exists: true,
              onboarding_completed: profile.onboarding_completed || false,
              profile: {
                ...profile,
                professional_ids: []
              }
            }, 200, {
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            });
          }

          return createResponse({
            exists: true,
            onboarding_completed: profile.onboarding_completed || false,
            profile: {
              ...profile,
              professional_ids: professionalIds || []
            }
          }, 200, {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          });
        }

        // Create new profile using stored procedure
        const { data: newProfile, error: createError } = await supabase
          .rpc('update_profile_with_related', {
            p_clerk_user_id: userId,
            p_email: clerkUser.emailAddresses[0]?.emailAddress || '',
            p_phone_number: clerkUser.phoneNumbers[0]?.phoneNumber || '',
            p_first_name: clerkUser.firstName || '',
            p_last_name: clerkUser.lastName || '',
            p_avatar_url: clerkUser.imageUrl || '',
            p_onboarding_completed: false,
            p_professional_ids: []
          });

        if (createError) {
          console.error('Error creating profile:', createError);
          return NextResponse.json(
            { error: `Failed to create profile: ${createError.message}` },
            { status: 500 }
          );
        }

        // Handle empty or invalid response
        if (!newProfile) {
          console.error('No profile data returned from creation');
          return NextResponse.json(
            { error: 'Failed to create profile - no data returned' },
            { status: 500 }
          );
        }

        // Ensure we have a valid object before proceeding
        const profileData = typeof newProfile === 'string' 
          ? (() => {
              try {
                return JSON.parse(newProfile);
              } catch (e) {
                console.error('Error parsing profile data:', e);
                return null;
              }
            })()
          : newProfile;

        if (!profileData || typeof profileData !== 'object') {
          console.error('Invalid profile data structure:', profileData);
          return NextResponse.json(
            { error: 'Invalid profile data structure' },
            { status: 500 }
          );
        }

        // Get professional IDs for the new profile
        const { data: professionalIds, error: professionalIdsError } = await supabase
          .from('professional_ids')
          .select('*')
          .eq('profile_id', profileData.id);

        if (professionalIdsError) {
          console.error('Error fetching professional IDs for new profile:', professionalIdsError);
          // Don't throw error, just return empty array
          return createResponse({
            exists: true,
            onboarding_completed: profileData.onboarding_completed || false,
            profile: {
              ...profileData,
              professional_ids: []
            }
          });
        }

        return createResponse({
          exists: true,
          onboarding_completed: profileData.onboarding_completed || false,
          profile: {
            ...profileData,
            professional_ids: professionalIds || []
          }
        });
      } catch (err) {
        if (err instanceof AppError) throw err;
        
        console.error('API route: Error checking profile, attempt', retryCount + 1, err);
        if (retryCount < MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          retryCount++;
        } else {
          throw new AppError(
            "Failed to check profile after retries",
            ErrorCodes.DATABASE.CONNECTION_ERROR,
            500
          );
        }
      }
    }

    throw new AppError(
      "Unexpected error in profile check",
      ErrorCodes.AUTH.TOKEN_INVALID,
      500
    );
  } catch (error) {
    console.error('API route: Unexpected error:', error);
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.status, error.code);
    }
    return createErrorResponse(
      "Internal server error",
      500,
      ErrorCodes.AUTH.TOKEN_INVALID
    );
  }
} 