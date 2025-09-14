import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(request, NextResponse.next(), sessionOptions);
    
    const { icsUrl } = await request.json();
    
    if (!icsUrl || typeof icsUrl !== 'string') {
      return NextResponse.json(
        { error: 'ICS URL is required' },
        { status: 400 }
      );
    }

    // Basic URL validation
    if (!icsUrl.includes('.ics') || !icsUrl.startsWith('http')) {
      return NextResponse.json(
        { error: 'Invalid ICS URL format' },
        { status: 400 }
      );
    }

    // Save to session
    session.icsUrl = icsUrl;
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