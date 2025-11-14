import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from './lib/session';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

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

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};