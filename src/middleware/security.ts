import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { sessionManager } from '@/lib/session';
import { apiRateLimiter } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import env from '@/config/env';

// Define CSP
const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://va.vercel-scripts.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https://*.clerk.accounts.dev https://img.clerk.com;
    frame-src 'self' https://*.clerk.accounts.dev;
    connect-src 'self' https://*.clerk.accounts.dev https://clerk.com;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
`.replace(/\s+/g, ' ').trim();

export async function securityMiddleware(req: NextRequest) {
  const startTime = Date.now();
  const path = req.nextUrl.pathname;

  try {
    // Skip security checks for static files and public routes
    if (
      path.startsWith('/_next') ||
      path.startsWith('/static') ||
      path.startsWith('/api/webhooks') ||
      path === '/health'
    ) {
      return NextResponse.next();
    }

    // Rate limiting for API routes
    if (path.startsWith('/api/')) {
      const ip = req.ip || 'unknown';
      const rateLimitResult = await apiRateLimiter.check(`api:${ip}`);

      if (!rateLimitResult.success) {
        logger.warn('Rate limit exceeded', {
          ip,
          path,
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset,
        });

        return new NextResponse(
          JSON.stringify({
            error: 'Too many requests',
            retryAfter: rateLimitResult.reset,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': rateLimitResult.reset.toString(),
            },
          }
        );
      }
    }

    // Set cookie store for session management
    sessionManager.setCookieStore(cookies());

    // Session validation for protected routes
    if (path.startsWith('/api/') || path.startsWith('/dashboard')) {
      const isValid = await sessionManager.validateSession();
      if (!isValid) {
        logger.warn('Invalid session', { path });
        return NextResponse.redirect(new URL('/login', req.url));
      }

      // Enforce session expiry
      await sessionManager.enforceSessionExpiry();
    }

    // CORS headers
    const response = NextResponse.next();
    const origin = req.headers.get('origin');
    
    if (origin && env.CORS_ORIGINS.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // Security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Log the request
    const duration = Date.now() - startTime;
    logger.logApiRequest(
      req.method,
      path,
      response.status,
      duration,
      {
        ip: req.ip,
        userAgent: req.headers.get('user-agent'),
      }
    );

    return response;
  } catch (error) {
    logger.error('Security middleware error', error as Error, {
      path,
      method: req.method,
    });

    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
} 