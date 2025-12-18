import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { DEMO_USER_ID, DEMO_USER_PROFILE } from '@/lib/demo-data';

export async function GET(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(cookies(), sessionOptions);

        session.destroy();
        const newSession = await getIronSession<SessionData>(cookies(), sessionOptions);

        newSession.isLoggedIn = true;
        newSession.userId = DEMO_USER_ID;
        newSession.email = DEMO_USER_PROFILE.email;
        newSession.firstName = DEMO_USER_PROFILE.firstName;
        newSession.icsUrls = [DEMO_USER_PROFILE.icsUrls.d2l, DEMO_USER_PROFILE.icsUrls.googleCalendar];

        await newSession.save();

        return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
        console.error('Demo auth failed:', error);
        return NextResponse.json({ error: 'Failed to start demo session' }, { status: 500 });
    }
}
