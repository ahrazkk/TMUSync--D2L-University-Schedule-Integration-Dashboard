import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json({ 
      icsUrl: session.icsUrl || null,
      username: session.username || null,
      hasDefaultUrl: !!process.env.D2L_ICS_URL
    });
  } catch (error) {
    console.error('Setup GET API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    
    const { icsUrl } = await request.json();
    
    if (!icsUrl || typeof icsUrl !== 'string') {
      // Allow clearing the URL by setting it to empty string
      if (icsUrl === '') {
        session.icsUrl = '';
        await session.save();
        return NextResponse.json({ success: true });
      }
      
      return NextResponse.json(
        { error: 'ICS URL is required' },
        { status: 400 }
      );
    }

    // Basic URL validation (only if not empty)
    if (icsUrl.trim() && (!icsUrl.includes('.ics') || !icsUrl.startsWith('http'))) {
      return NextResponse.json(
        { error: 'Invalid ICS URL format' },
        { status: 400 }
      );
    }

    // Save to session
    session.icsUrl = icsUrl.trim();
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Setup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}