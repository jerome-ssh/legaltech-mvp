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

    // If user is authenticated and trying to access onboarding, allow it
    if (req.nextUrl.pathname === '/onboarding') {
      console.log('User accessing onboarding');
      return NextResponse.next();
    }

    // For all other routes, check if user has completed onboarding
    let onboardingCompleted = false;
    if (auth.userId) {
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

      // Check if profile exists in Supabase using API route
      try {
        const res = await fetch(new URL('/api/profile/check', req.url), { method: 'GET' });
        const { exists, onboarding_completed } = await res.json();
        
        if (!exists) {
          // If no profile exists, redirect to onboarding
          console.log('Middleware: No profile found, redirecting to onboarding');
          return NextResponse.redirect(new URL('/onboarding', req.url));
        }

        // If profile exists but onboarding is not completed, redirect to onboarding
        if (!onboarding_completed) {
          console.log('Middleware: Profile exists but onboarding not completed, redirecting to onboarding');
          return NextResponse.redirect(new URL('/onboarding', req.url));
        }
      } catch (err) {
        console.error('Middleware: Error checking profile:', err);
        // If we can't check the profile, redirect to onboarding to be safe
        return NextResponse.redirect(new URL('/onboarding', req.url));
      }
    }

    // If onboarding is not completed or no profile exists, redirect to onboarding
    if (!onboardingCompleted && !req.nextUrl.pathname.startsWith('/onboarding')) {
      console.log('User has not completed onboarding, redirecting to onboarding');
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    // If onboarding is completed and profile exists, allow access to dashboard
    if (onboardingCompleted && req.nextUrl.pathname === '/dashboard') {
      console.log('User has completed onboarding, allowing access to dashboard');
      return NextResponse.next();
    }

    console.log('User authenticated and authorized, proceeding to:', req.nextUrl.pathname);
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


