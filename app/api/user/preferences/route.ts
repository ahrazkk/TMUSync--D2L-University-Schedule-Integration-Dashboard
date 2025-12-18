import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { updateUserPreferences, UserPreferences } from '@/lib/user-storage';

export async function POST(req: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(cookies(), sessionOptions);
        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await req.json();
        // Validate and sanitize input
        const preferences: UserPreferences = {
            auroraIntensity: Math.min(100, Math.max(0, Number(body.auroraIntensity ?? 60))),
            noiseOpacity: Math.min(100, Math.max(0, Number(body.noiseOpacity ?? 40))),
            enableSpotlight: Boolean(body.enableSpotlight)
        };

        await updateUserPreferences(session.userId, preferences);

        return NextResponse.json({ success: true, preferences });
    } catch (error) {
        console.error('Failed to save preferences:', error);
        return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
    }
}
