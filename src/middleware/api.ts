import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function validateApiSession(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get session from cookie
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if session is expired
    if (new Date(session.expires_at!) < new Date()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    // Add user info to request headers for downstream handlers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', session.user.id);
    requestHeaders.set('x-user-role', session.user.role || 'user');

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('API middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to check user roles
export function checkUserRole(req: NextRequest, allowedRoles: string[]) {
  const userRole = req.headers.get('x-user-role');
  
  if (!userRole || !allowedRoles.includes(userRole)) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  return null;
} 