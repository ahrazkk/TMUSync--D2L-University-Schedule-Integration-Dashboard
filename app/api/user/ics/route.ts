/**
 * User ICS URLs API Route
 * Update ICS URLs for the user
 */
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { updateIcsUrls } from '@/lib/user-storage';

interface IcsUrlsRequest {
    d2l?: string;
    googleCalendar?: string;
}

export async function POST(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(cookies(), sessionOptions);

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body: IcsUrlsRequest = await request.json();
        const { d2l, googleCalendar } = body;

        // Update ICS URLs in Firestore
        await updateIcsUrls(session.userId, {
            d2l: d2l || undefined,
            googleCalendar: googleCalendar || undefined,
        });

        // Also update session
        session.icsUrls = [d2l, googleCalendar].filter(Boolean) as string[];
        await session.save();

        return NextResponse.json({
            success: true,
            message: 'ICS URLs updated successfully',
        });
    } catch (error) {
        console.error('[ICS URL API] Error:', error);
        return NextResponse.json({ error: 'Failed to update ICS URLs' }, { status: 500 });
    }
}
