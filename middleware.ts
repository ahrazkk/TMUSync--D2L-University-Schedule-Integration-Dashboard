import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from './lib/session';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Check for demo mode query parameter (set during demo login redirect)
  const { searchParams, pathname } = request.nextUrl;
  const isDemoMode = searchParams.get('demo') === 'true';
  
  // Check for demo cookie that persists across requests
  const demoCookie = request.cookies.get('demo-mode');
  const hasDemoCookie = demoCookie?.value === 'true';
  
  // If in demo mode, bypass session authentication entirely
  if (isDemoMode || hasDemoCookie) {
    console.log(`[Middleware] ${pathname} - Demo mode active, bypassing session check`);
    
    // Set demo cookie if coming from login with demo param
    if (isDemoMode && !hasDemoCookie) {
      response.cookies.set('demo-mode', 'true', {
        httpOnly: false, // Allow client-side access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }
    
    // Remove demo param from URL to clean it up
    if (isDemoMode && pathname !== '/login') {
      const url = request.nextUrl.clone();
      url.searchParams.delete('demo');
      if (url.search !== request.nextUrl.search) {
        return NextResponse.redirect(url);
      }
    }
    
    return response;
  }
  
  // Use request/response pattern for middleware in Next.js 14
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  const { isLoggedIn } = session;

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