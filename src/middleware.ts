import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
  "/forgot-password",
  "/api/check-onboarding",
  "/api/profile/update",
  "/api/profile/check",
  "/api/profile/avatar",
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

export default authMiddleware({
  publicRoutes: publicPaths,
  debug: true, // Enable Clerk's debug mode
  afterAuth: async (auth, req) => {
    // Enhanced debug logging
    console.log('Auth object:', auth);

    // Handle public routes
    if (isPublic(req.nextUrl.pathname)) {
      console.log('Public route accessed:', req.nextUrl.pathname);
      return NextResponse.next();
    }

    // Special handling for SSO callback and related routes
    if (req.nextUrl.pathname.startsWith('/signup/sso-callback') || 
        req.nextUrl.pathname.startsWith('/signup/continue') ||
        req.nextUrl.pathname.startsWith('/sso-callback') ||
        req.nextUrl.pathname.startsWith('/signup/social-callback')) {
      console.log('SSO callback flow detected, allowing access');
      return NextResponse.next();
    }

    // If user is not authenticated, redirect to login
    if (!auth.userId || !auth.sessionId) {
      console.log('User not authenticated, redirecting to login');
      const signInUrl = new URL("/login", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    // If user is authenticated and trying to access auth pages, redirect to onboarding
    if (req.nextUrl.pathname.startsWith('/login') || 
        req.nextUrl.pathname.startsWith('/signup')) {
      console.log('Authenticated user accessing auth pages, redirecting to onboarding');
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    // For all other routes, check if user has completed onboarding
    let onboardingCompleted = false;
    let profileOnboardingCompleted = false;

    if (auth.userId) {
      // Check Clerk metadata first
      if (process.env.CLERK_SECRET_KEY) {
        try {
          const res = await fetch(`https://api.clerk.dev/v1/users/${auth.userId}`, {
            headers: {
              Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
            },
          });
          const userData = await res.json();
          onboardingCompleted =
            userData.unsafe_metadata?.onboardingCompleted ||
            userData.public_metadata?.onboardingCompleted;
          console.log('Middleware: Clerk API onboardingCompleted:', onboardingCompleted);
        } catch (err) {
          console.error('Middleware: Error fetching user from Clerk API:', err);
        }
      }

      // Check profile status with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      const retryDelay = 1000; // 1 second

      while (retryCount < maxRetries) {
        try {
          // Get the session token for the internal request
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

          if (!exists) {
            console.log('Middleware: No profile found, attempt', retryCount + 1);
            if (retryCount < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              retryCount++;
              continue;
            }
            // If we've exhausted retries and still no profile, redirect to onboarding
            console.log('Middleware: No profile found after retries, redirecting to onboarding');
            return NextResponse.redirect(new URL('/onboarding', req.url));
          }

          profileOnboardingCompleted = onboarding_completed;
          console.log('Middleware: Profile onboarding status:', profileOnboardingCompleted);
          break; // Success, exit retry loop
        } catch (err) {
          console.error('Middleware: Error checking profile, attempt', retryCount + 1, err);
          if (retryCount < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retryCount++;
          } else {
            // If we've exhausted retries and still getting errors, redirect to onboarding to be safe
            console.log('Middleware: Profile check failed after retries, redirecting to onboarding');
            return NextResponse.redirect(new URL('/onboarding', req.url));
          }
        }
      }
    }

    // If either Clerk metadata or profile shows onboarding is completed, allow access
    const isOnboardingCompleted = onboardingCompleted || profileOnboardingCompleted;
    console.log('Middleware: Final onboarding status:', { 
      clerkStatus: onboardingCompleted, 
      profileStatus: profileOnboardingCompleted,
      finalStatus: isOnboardingCompleted 
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


