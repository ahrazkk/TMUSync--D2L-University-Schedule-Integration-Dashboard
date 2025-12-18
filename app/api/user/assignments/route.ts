/**
 * Custom Assignments API Route
 * Create, update, and delete custom assignments
 */
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { addCustomAssignment, removeCustomAssignment, getUserData } from '@/lib/user-storage';

interface CreateAssignmentRequest {
    title: string;
    dueDate: string;
    courseKey?: string;
    repetition?: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
    priority?: 'low' | 'medium' | 'high';
}

// GET - Fetch custom assignments
export async function GET() {
    try {
        const session = await getIronSession<SessionData>(cookies(), sessionOptions);

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const userData = await getUserData(session.userId);

        if (!userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            customAssignments: userData.customAssignments || [],
        });
    } catch (error) {
        console.error('[Custom Assignments API] GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }
}

// POST - Create new custom assignment
export async function POST(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(cookies(), sessionOptions);

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body: CreateAssignmentRequest = await request.json();
        const { title, dueDate, courseKey, repetition = 'none', priority = 'medium' } = body;

        // Validation
        if (!title || !dueDate) {
            return NextResponse.json(
                { error: 'Title and due date are required' },
                { status: 400 }
            );
        }

        const assignmentId = await addCustomAssignment(session.userId, {
            title,
            dueDate,
            courseKey,
            repetition,
            priority,
        });

        return NextResponse.json({
            success: true,
            assignmentId,
        });
    } catch (error) {
        console.error('[Custom Assignments API] POST Error:', error);
        return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
    }
}

// DELETE - Remove custom assignment
export async function DELETE(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(cookies(), sessionOptions);

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const assignmentId = searchParams.get('id');

        if (!assignmentId) {
            return NextResponse.json(
                { error: 'Assignment ID is required' },
                { status: 400 }
            );
        }

        await removeCustomAssignment(session.userId, assignmentId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Custom Assignments API] DELETE Error:', error);
        return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
    }
}
