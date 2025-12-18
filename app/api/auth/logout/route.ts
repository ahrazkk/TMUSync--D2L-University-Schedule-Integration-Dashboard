import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

export async function POST(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(cookies(), sessionOptions);
        session.destroy();

        return NextResponse.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout failed:', error);
        return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(cookies(), sessionOptions);
        session.destroy();

        return NextResponse.redirect(new URL('/', request.url));
    } catch (error) {
        console.error('Logout failed:', error);
        return NextResponse.redirect(new URL('/', request.url));
    }
}
