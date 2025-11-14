import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // For demo mode simplicity, we're disabling server-side authentication
  // All auth checks are handled client-side in the components
  // This allows demo mode to work seamlessly on Vercel without session cookie issues
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};