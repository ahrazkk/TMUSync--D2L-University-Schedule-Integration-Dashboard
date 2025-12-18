/**
 * Class Customizations API Route
 * Update class descriptions, hidden state, and linked assignments
 */
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { updateClassCustomization, ClassCustomization, getUserData } from '@/lib/user-storage';

// GET - Fetch all customizations
export async function GET() {
    try {
        const session = await getIronSession<SessionData>(cookies(), sessionOptions);

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const userData = await getUserData(session.userId);

        return NextResponse.json({
            customizations: userData?.classCustomizations || {},
        });
    } catch (error) {
        console.error('[Customizations API] GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch customizations' }, { status: 500 });
    }
}

// POST - Update customization for a specific class
export async function POST(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(cookies(), sessionOptions);

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body: { classId: string; customization: ClassCustomization } = await request.json();
        const { classId, customization } = body;

        if (!classId || !customization) {
            return NextResponse.json(
                { error: 'Class ID and customization data are required' },
                { status: 400 }
            );
        }

        await updateClassCustomization(session.userId, classId, customization);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Customizations API] POST Error:', error);
        return NextResponse.json({ error: 'Failed to update customization' }, { status: 500 });
    }
}
