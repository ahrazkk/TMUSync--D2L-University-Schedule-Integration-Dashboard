import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  
  try {
    const body = await request.json();
    
    if (body.useCache) {
      // Create a mock session for cache/offline mode
      session.isLoggedIn = true;
      session.username = 'cache-user';
      session.id = 'offline-mode';
      // Note: We don't set icsUrl so it will rely on cached data only
      
      await session.save();
      
      // Return the response with the session cookie
      return NextResponse.json({ 
        success: true, 
        message: 'Using cached data mode',
        offlineMode: true 
      }, {
        headers: response.headers
      });
    }
    
    // Regular reauth logic would go here
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid reauth request' 
    }, { status: 400 });
    
  } catch (error) {
    console.error('[Quick Reauth] Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Reauth failed' 
    }, { status: 500 });
  }
}