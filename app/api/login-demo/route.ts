import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { DEMO_SCHEDULE_DATA } from '@/lib/demo-data';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function POST() {
  try {
    console.log('[Demo Login API] Starting demo login...');

    // Create a session for demo mode using cookies()
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    
    session.isLoggedIn = true;
    session.username = 'demo_user';
    session.isDemo = true;
    
    await session.save();

    console.log('[Demo Login API] Session created and saved. isLoggedIn:', session.isLoggedIn);

    return NextResponse.json({
      success: true,
      message: 'Demo login successful',
      schedule: { classes: DEMO_SCHEDULE_DATA.classes },
      assignments: DEMO_SCHEDULE_DATA.assignments
    });
  } catch (error) {
    console.error('[Demo Login API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to start demo mode' 
      },
      { status: 500 }
    );
  }
}
