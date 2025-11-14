import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from './lib/session';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  const { isLoggedIn } = session;
  const { pathname } = request.nextUrl;

  // Debug logging
  console.log(`[Middleware] ${pathname} - isLoggedIn: ${isLoggedIn}, username: ${session.username}`)

  // Allow access to login page and setup page for unauthenticated users
  const publicPaths = ['/login', '/setup'];
  const isPublicPath = publicPaths.includes(pathname);

  // If user is not logged in and trying to access a protected route
  if (!isLoggedIn && !isPublicPath) {
    console.log(`[Middleware] Redirecting ${pathname} to /login - not logged in`)
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is logged in and trying to visit login page, redirect to dashboard
  if (isLoggedIn && pathname === '/login') {
    console.log(`[Middleware] Redirecting /login to / - already logged in`)
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};