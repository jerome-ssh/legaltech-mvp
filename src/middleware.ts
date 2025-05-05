import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default clerkMiddleware(async (auth, req) => {
  // List your public routes here
  const publicRoutes = ["/login", "/signup", "/"];
  if (publicRoutes.includes(req.nextUrl.pathname)) {
    return;
  }
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};


