import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { AppError, ErrorCodes } from "@/lib/errors";
import { isProduction } from "@/config/env";

// Cache for profile checks with TTL
const profileCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Debug logging for environment variables
if (!isProduction) {
  console.log('Environment variables in middleware:', {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'exists' : 'missing',
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? 'exists' : 'missing'
  });
}

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
  if (Array.isArray(userData.external_accounts) && userData.external_accounts.length > 0) {
    return userData.external_accounts.some((acc: any) => acc.provider && acc.provider.startsWith('oauth_'));
  }
  return false;
}

// Function to clear cache for a user
function clearUserCache(userId: string) {
  for (const key of profileCache.keys()) {
    if (key.startsWith(`${userId}-`)) {
      profileCache.delete(key);
    }
  }
}

// Optimized profile check function with caching
async function checkProfile(userId: string, token: string, req: NextRequest) {
  const cacheKey = `${userId}-${req.nextUrl.pathname}`;
  const cached = profileCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(new URL('/api/profile/check', req.url), {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Authorization': `Bearer ${token}`,
        'Cookie': req.headers.get('cookie') || ''
      },
      signal: controller.signal
    });

    if (!res.ok) {
      throw new Error(`Profile check failed with status: ${res.status}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Profile check failed');
    }

    // Cache the result
    profileCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Profile check timed out');
      return { exists: false, onboarding_completed: false };
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// Optimized duplicate check function
async function checkDuplicates(userData: any, userId: string) {
  const phoneNumber = userData.phone_numbers?.[0]?.phone_number;
  const email = userData.email_addresses?.[0]?.email_address;
  const errors = [];

  if (phoneNumber && !isSocialSignIn(userData)) {
    const { data: existingPhoneProfile } = await supabase
      .from('profiles')
      .select('clerk_id')
      .eq('phone_number', phoneNumber)
      .neq('clerk_id', userId)
      .single();

    if (existingPhoneProfile) {
      errors.push({
        message: "Phone number is already associated with another account",
        code: "PHONE_NUMBER_IN_USE"
      });
    }
  }

  if (email) {
    const { data: existingEmailProfile } = await supabase
      .from('profiles')
      .select('clerk_id')
      .eq('email', email)
      .neq('clerk_id', userId)
      .single();

    if (existingEmailProfile) {
      errors.push({
        message: "Email is already associated with another account",
        code: "EMAIL_IN_USE"
      });
    }
  }

  return errors;
}

export default authMiddleware({
  publicRoutes: publicPaths,
  debug: !isProduction,
  afterAuth: async (auth, req) => {
    // Handle public routes
    if (isPublic(req.nextUrl.pathname)) {
      if (req.nextUrl.pathname.startsWith('/signup') && auth.userId) {
        try {
          const token = await auth.getToken();
          
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
              const errors = await checkDuplicates(userData, auth.userId);
              
              if (errors.length > 0) {
                const error = errors[0];
                throw new AppError(error.message, error.code, 400);
              }
            }
          }

          const profileData = await checkProfile(auth.userId, token, req);
          if (profileData.exists) {
            return NextResponse.redirect(new URL(
              profileData.onboarding_completed ? '/dashboard' : '/onboarding',
              req.url
            ));
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
          console.error('Error checking profile during sign-up:', error);
        }
      }
      return NextResponse.next();
    }

    // Handle auth flow routes
    if (req.nextUrl.pathname.startsWith('/signup/verify') ||
        req.nextUrl.pathname.startsWith('/signup/continue') ||
        req.nextUrl.pathname.startsWith('/signup/social-callback') ||
        req.nextUrl.pathname.startsWith('/signup/sso-callback') ||
        req.nextUrl.pathname.startsWith('/sso-callback') ||
        req.nextUrl.pathname.startsWith('/verify')) {
      
      if (auth.userId) {
        try {
          const token = await auth.getToken();
          const profileData = await checkProfile(auth.userId, token, req);
          
          if (profileData.exists) {
            return NextResponse.redirect(new URL(
              profileData.onboarding_completed ? '/dashboard' : '/onboarding',
              req.url
            ));
          }
        } catch (error) {
          console.error('Error checking profile during auth flow:', error);
        }
      }
      return NextResponse.next();
    }

    // Handle unauthenticated users
    if (!auth.userId || !auth.sessionId) {
      const signInUrl = new URL("/login", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    // Check onboarding status
    let onboardingCompleted = false;
    let profileExists = false;

    if (auth.userId) {
      try {
        const token = await auth.getToken();
        const profileData = await checkProfile(auth.userId, token, req);
        
        if (profileData.exists) {
          profileExists = true;
          onboardingCompleted = profileData.onboarding_completed;
          
          // Clear cache if we're on the onboarding page and it's completed
          if (req.nextUrl.pathname === '/onboarding' && onboardingCompleted) {
            clearUserCache(auth.userId);
            return NextResponse.redirect(new URL('/dashboard', req.url));
          }
          
          if (!onboardingCompleted && !req.nextUrl.pathname.startsWith('/onboarding')) {
            return NextResponse.redirect(new URL('/onboarding', req.url));
          }
        } else if (!req.nextUrl.pathname.startsWith('/onboarding')) {
          return NextResponse.redirect(new URL('/onboarding', req.url));
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        // Clear cache on error to ensure fresh data on next request
        if (auth.userId) {
          clearUserCache(auth.userId);
        }
        if (!req.nextUrl.pathname.startsWith('/onboarding')) {
          return NextResponse.redirect(new URL('/onboarding', req.url));
        }
      }
    }

    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
    "/",
    "/(api|trpc)(.*)"
  ],
};


