import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { AppError, ErrorCodes } from "@/lib/errors";
import { isProduction } from "@/config/env";

// Debug logging for environment variables
console.log('Environment variables in middleware:', {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'exists' : 'missing',
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? 'exists' : 'missing'
});

const publicPaths = [
  "/",
  "/login",
  "/signup",
  "/signup/social-callback",
  "/signup/sso-callback",
  "/signup/continue",
  "/signup/verify-email-address",
  "/signup/verify",
  "/forgot-password",
  "/reset-password",
  "/api/check-onboarding",
  "/api/profile/update",
  "/api/profile/check",
  "/api/profile/avatar",
  "/api/roles",
  "/api/profile/onboarding-path",
  "/onboarding",
  "/sso-callback",
  "/verify-email",
  "/api/webhooks/clerk",
  "/debug"
];

const isPublic = (path: string) => {
  return publicPaths.find((x) =>
    path.match(new RegExp(`^${x.replace(/\*/g, ".*")}$`))
  );
};

// Helper to determine if user is a social (Google) sign-in
function isSocialSignIn(userData: any): boolean {
  if (!userData) return false;
  // Clerk user object has external_accounts array for social sign-ins
  if (Array.isArray(userData.external_accounts) && userData.external_accounts.length > 0) {
    // Check for Google or any OAuth provider
    return userData.external_accounts.some((acc: any) => acc.provider && acc.provider.startsWith('oauth_'));
  }
  return false;
}

export default authMiddleware({
  publicRoutes: publicPaths,
  debug: !isProduction,
  afterAuth: async (auth, req) => {
    // Handle public routes and sign-up related routes
    if (isPublic(req.nextUrl.pathname)) {
      // For sign-up routes, check if user is already authenticated
      if (req.nextUrl.pathname.startsWith('/signup') && auth.userId) {
        try {
          const token = await auth.getToken();
          
          // First check Clerk for phone number and email
          if (process.env.CLERK_SECRET_KEY) {
            const clerkRes = await fetch(`https://api.clerk.dev/v1/users/${auth.userId}`, {
              headers: {
                Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              },
            });
            
            if (clerkRes.ok) {
              const userData = await clerkRes.json();
              const phoneNumber = userData.phone_numbers?.[0]?.phone_number;
              const email = userData.email_addresses?.[0]?.email_address;
              
              // Check for duplicate phone number
              if (phoneNumber) {
                const { data: existingPhoneProfile } = await supabase
                  .from('profiles')
                  .select('clerk_id')
                  .eq('phone_number', phoneNumber)
                  .neq('clerk_id', auth.userId)
                  .single();

                if (existingPhoneProfile) {
                  throw new AppError(
                    "Phone number is already associated with another account",
                    ErrorCodes.VALIDATION.DUPLICATE_RECORD,
                    400
                  );
                }
              }

              // Check for duplicate email
              if (email) {
                const { data: existingEmailProfile } = await supabase
                  .from('profiles')
                  .select('clerk_id')
                  .eq('email', email)
                  .neq('clerk_id', auth.userId)
                  .single();

                if (existingEmailProfile) {
                  throw new AppError(
                    "Email is already associated with another account",
                    ErrorCodes.VALIDATION.DUPLICATE_RECORD,
                    400
                  );
                }
              }
            }
          }

          // Then check profile status
          const res = await fetch(new URL('/api/profile/check', req.url), {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Authorization': `Bearer ${token}`,
              'Cookie': req.headers.get('cookie') || ''
            }
          });

          if (res.ok) {
            const { exists, onboarding_completed } = await res.json();
            if (exists) {
              return NextResponse.redirect(new URL(
                onboarding_completed ? '/dashboard' : '/onboarding',
                req.url
              ));
            }
          }
        } catch (error) {
          if (error instanceof AppError) {
            const isApiRequest = req.nextUrl.pathname.startsWith('/api/');
            if (isApiRequest) {
              return NextResponse.json(
                {
                  success: false,
                  error: error.message,
                  code: error.code
                },
                { status: error.status }
              );
            } else {
              const loginUrl = new URL('/login', req.url);
              loginUrl.searchParams.set('error', error.code);
              return NextResponse.redirect(loginUrl);
            }
          }
          // On unexpected error, allow access to sign-up to handle the error case
          console.error('Error checking profile during sign-up:', error);
        }
      }

      // Allow access to public routes
      console.log('Public route accessed:', req.nextUrl.pathname);
      return NextResponse.next();
    }

    // Special handling for auth flow routes
    if (req.nextUrl.pathname.startsWith('/signup/verify') ||
        req.nextUrl.pathname.startsWith('/signup/continue') ||
        req.nextUrl.pathname.startsWith('/signup/social-callback') ||
        req.nextUrl.pathname.startsWith('/signup/sso-callback') ||
        req.nextUrl.pathname.startsWith('/sso-callback') ||
        req.nextUrl.pathname.startsWith('/verify')) {
      
      // For verification routes, check if user is authenticated
      if (auth.userId) {
        console.log('Auth flow route with authenticated user:', req.nextUrl.pathname);
        
        // Check if user already has a profile
        try {
          const token = await auth.getToken();
          const res = await fetch(new URL('/api/profile/check', req.url), {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Authorization': `Bearer ${token}`,
              'Cookie': req.headers.get('cookie') || ''
            }
          });

          if (res.ok) {
            const { exists, onboarding_completed } = await res.json();
            if (exists) {
              console.log('User already has profile during auth flow, redirecting to appropriate page');
              return NextResponse.redirect(new URL(
                onboarding_completed ? '/dashboard' : '/onboarding',
                req.url
              ));
            }
          }
        } catch (error) {
          console.error('Error checking profile during auth flow:', error);
          // On error, allow access to continue the auth flow
        }
      }

      console.log('Auth flow route detected, allowing access:', req.nextUrl.pathname);
      return NextResponse.next();
    }

    // If user is not authenticated, redirect to login
    if (!auth.userId || !auth.sessionId) {
      console.log('User not authenticated, redirecting to login');
      const signInUrl = new URL("/login", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    // For all other routes, check if user has completed onboarding
    let onboardingCompleted = false;
    let profileOnboardingCompleted = false;
    let profileExists = false;

    if (auth.userId) {
      // Check Clerk metadata first
      if (process.env.CLERK_SECRET_KEY) {
        try {
          const res = await fetch(`https://api.clerk.dev/v1/users/${auth.userId}`, {
            headers: {
              Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
          });
          
          if (!res.ok) {
            throw new Error(`Clerk API returned ${res.status}`);
          }

          const userData = await res.json();
          onboardingCompleted =
            userData.unsafe_metadata?.onboardingCompleted ||
            userData.public_metadata?.onboardingCompleted;
          
          // Check for duplicate phone number
          const phoneNumber = userData.phone_numbers?.[0]?.phone_number;
          if (phoneNumber && !isSocialSignIn(userData)) {
            const { data: existingPhoneProfile } = await supabase
              .from('profiles')
              .select('clerk_id')
              .eq('phone_number', phoneNumber)
              .neq('clerk_id', auth.userId)
              .single();

            if (existingPhoneProfile) {
              const isApiRequest = req.nextUrl.pathname.startsWith('/api/');
              if (isApiRequest) {
                return NextResponse.json(
                  {
                    success: false,
                    error: "Phone number is already associated with another account",
                    code: "PHONE_NUMBER_IN_USE"
                  },
                  { status: 400 }
                );
              } else {
                // Redirect to login with error code for page requests
                const loginUrl = new URL('/login', req.url);
                loginUrl.searchParams.set('error', 'PHONE_NUMBER_IN_USE');
                return NextResponse.redirect(loginUrl);
              }
            }
          }
          
          // Check for duplicate email
          const email = userData.email_addresses?.[0]?.email_address;
          if (email) {
            const { data: existingEmailProfile } = await supabase
              .from('profiles')
              .select('clerk_id')
              .eq('email', email)
              .neq('clerk_id', auth.userId)
              .single();

            if (existingEmailProfile) {
              const isApiRequest = req.nextUrl.pathname.startsWith('/api/');
              if (isApiRequest) {
                return NextResponse.json(
                  {
                    success: false,
                    error: "Email is already associated with another account",
                    code: "EMAIL_IN_USE"
                  },
                  { status: 400 }
                );
              } else {
                // Redirect to login with error code for page requests
                const loginUrl = new URL('/login', req.url);
                loginUrl.searchParams.set('error', 'EMAIL_IN_USE');
                return NextResponse.redirect(loginUrl);
              }
            }
          }
          
          console.log('Middleware: Clerk API onboarding status:', {
            onboardingCompleted,
            metadata: {
              unsafe: userData.unsafe_metadata?.onboardingCompleted,
              public: userData.public_metadata?.onboardingCompleted
            },
            email: userData.email_addresses?.[0]?.email_address,
            phoneNumber: phoneNumber
          });
        } catch (err) {
          console.error('Middleware: Error fetching user from Clerk API:', err);
          // On error, assume onboarding is not completed
          onboardingCompleted = false;
        }
      }

      // Check profile status with retry logic
      let retryCount = 0;
      const maxRetries = 2; // Reduced from 3 to 2
      const retryDelay = 500; // Reduced from 1000 to 500ms

      while (retryCount < maxRetries) {
        try {
          const token = await auth.getToken();
          
          const res = await fetch(new URL('/api/profile/check', req.url), { 
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Authorization': `Bearer ${token}`,
              'Cookie': req.headers.get('cookie') || ''
            }
          });
          
          if (!res.ok) {
            throw new Error(`Profile check failed with status: ${res.status}`);
          }

          const { exists, onboarding_completed, success } = await res.json();
          
          if (!success) {
            throw new Error('Profile check returned unsuccessful');
          }

          profileExists = exists;
          profileOnboardingCompleted = onboarding_completed;
          
          console.log('Middleware: Profile check result:', {
            exists: profileExists,
            onboarding_completed: profileOnboardingCompleted,
            attempt: retryCount + 1,
            path: req.nextUrl.pathname,
            userId: auth.userId
          });

          // If profile doesn't exist, retry once before redirecting to onboarding
          if (!exists) {
            if (retryCount < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              retryCount++;
              continue;
            }
            console.log('Middleware: No profile found after retries, redirecting to onboarding');
            return NextResponse.redirect(new URL('/onboarding', req.url));
          }

          // If profile exists but onboarding is not completed, and we're not already on the onboarding page,
          // redirect to onboarding
          if (exists && !profileOnboardingCompleted && req.nextUrl.pathname !== '/onboarding') {
            console.log('Middleware: Profile exists but onboarding not completed, redirecting to onboarding');
            return NextResponse.redirect(new URL('/onboarding', req.url));
          }

          // If profile exists and onboarding is completed, and we're on the onboarding page,
          // redirect to dashboard
          if (exists && profileOnboardingCompleted && req.nextUrl.pathname === '/onboarding') {
            console.log('Middleware: Profile exists and onboarding completed, redirecting to dashboard');
            return NextResponse.redirect(new URL('/dashboard', req.url));
          }

          break; // Success, exit retry loop
        } catch (err) {
          console.error('Middleware: Error checking profile, attempt', retryCount + 1, err);
          if (retryCount < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retryCount++;
          } else {
            console.log('Middleware: Profile check failed after retries, redirecting to onboarding');
            return NextResponse.redirect(new URL('/onboarding', req.url));
          }
        }
      }
    }

    // Use AND logic for onboarding status - both Clerk and profile must agree
    const isOnboardingCompleted = onboardingCompleted && profileOnboardingCompleted;
    console.log('Middleware: Final onboarding status:', { 
      clerkStatus: onboardingCompleted, 
      profileStatus: profileOnboardingCompleted,
      profileExists,
      finalStatus: isOnboardingCompleted,
      path: req.nextUrl.pathname
    });

    // If onboarding is not completed and trying to access protected routes, redirect to onboarding
    if (!isOnboardingCompleted && !req.nextUrl.pathname.startsWith('/onboarding')) {
      console.log('Middleware: Onboarding not completed, redirecting to onboarding');
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    // If onboarding is completed and trying to access onboarding page, redirect to dashboard
    if (isOnboardingCompleted && req.nextUrl.pathname === '/onboarding') {
      console.log('Middleware: Onboarding completed, redirecting to dashboard');
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // If profile doesn't exist but user is authenticated, ensure they go to onboarding
    if (!profileExists && auth.userId && !req.nextUrl.pathname.startsWith('/onboarding')) {
      console.log('Middleware: No profile exists, redirecting to onboarding');
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    console.log('Middleware: User authenticated and authorized, proceeding to:', req.nextUrl.pathname);
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
    "/",
    "/(api|trpc)(.*)"
  ],
};


