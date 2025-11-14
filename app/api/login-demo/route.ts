import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { DEMO_SCHEDULE_DATA } from '@/lib/demo-data';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    console.log('[Demo Login API] Starting demo login...');

    const response = NextResponse.json({
      success: true,
      message: 'Demo login successful',
      schedule: { classes: DEMO_SCHEDULE_DATA.classes },
      assignments: DEMO_SCHEDULE_DATA.assignments
    });

    // Create a session for demo mode
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    
    session.isLoggedIn = true;
    session.username = 'demo_user';
    session.isDemo = true;
    
    await session.save();

    console.log('[Demo Login API] Session created successfully');

    return response;
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
