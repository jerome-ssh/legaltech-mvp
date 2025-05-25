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

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        clerk_id,
        email,
        first_name,
        last_name,
        phone_number,
        avatar_url,
        onboarding_completed,
        created_at,
        updated_at
      `)
      .eq('clerk_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('API route: Error checking profile:', profileError);
      throw new AppError(
        `Failed to check profile: ${profileError.message}`,
        ErrorCodes.DATABASE.CONNECTION_ERROR,
        500
      );
    }

    if (!profile) {
      console.error('API route: No profile found for user:', userId);
      throw new AppError(
        'Profile not found',
        ErrorCodes.AUTH.UNAUTHORIZED,
        404
      );
    }

    return createResponse({
      exists: true,
      onboarding_completed: profile.onboarding_completed || false,
      profile
    });
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