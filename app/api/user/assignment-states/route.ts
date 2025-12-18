/**
 * Assignment States API Route
 * Save and retrieve assignment completion states from Firebase
 */
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { adminDb } from '@/lib/firebase-admin';

interface AssignmentStatesRequest {
    completedIds: string[];
}

// GET - Retrieve assignment completion states
export async function GET(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(cookies(), sessionOptions);

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Check for Demo User
        const { DEMO_USER_ID, DEMO_ASSIGNMENT_STATES } = await import('@/lib/demo-data');
        if (session.userId === DEMO_USER_ID) {
            // Convert the record to array of IDs for the frontend
            const completedIds = Object.entries(DEMO_ASSIGNMENT_STATES)
                .filter(([_, state]) => state === 'completed')
                .map(([id]) => id);

            return NextResponse.json({
                completedIds
            });
        }

        // Get user's assignment states from Firestore
        const userDoc = await adminDb.collection('users').doc(session.userId).get();
        const userData = userDoc.data();

        const completedIds = userData?.assignmentStates?.completedIds || [];

        return NextResponse.json({
            completedIds,
        });
    } catch (error) {
        console.error('[Assignment States API] GET Error:', error);
        return NextResponse.json({ error: 'Failed to get assignment states' }, { status: 500 });
    }
}

// POST - Save assignment completion states
export async function POST(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(cookies(), sessionOptions);

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body: AssignmentStatesRequest = await request.json();
        const { completedIds } = body;

        // Check for Demo User
        const { DEMO_USER_ID } = await import('@/lib/demo-data');
        if (session.userId === DEMO_USER_ID) {
            // Mock success for demo user
            return NextResponse.json({
                success: true,
                message: 'Assignment states saved (Demo Mode)',
                count: completedIds.length,
            });
        }

        // Update user's assignment states in Firestore
        await adminDb.collection('users').doc(session.userId).update({
            'assignmentStates.completedIds': completedIds,
            'assignmentStates.updatedAt': new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            message: 'Assignment states saved',
            count: completedIds.length,
        });
    } catch (error) {
        console.error('[Assignment States API] POST Error:', error);
        return NextResponse.json({ error: 'Failed to save assignment states' }, { status: 500 });
    }
}

// PATCH - Toggle a single assignment completion state
export async function PATCH(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(cookies(), sessionOptions);

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { assignmentId, completed } = body;

        if (!assignmentId) {
            return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 });
        }

        // Check for Demo User
        const { DEMO_USER_ID } = await import('@/lib/demo-data');
        if (session.userId === DEMO_USER_ID) {
            // Mock success for demo user
            return NextResponse.json({
                success: true,
                completed,
                totalCompleted: completed ? 1 : 0, // Inaccurate total but sufficient for toggle response
            });
        }

        // Get current states
        const userDoc = await adminDb.collection('users').doc(session.userId).get();
        const userData = userDoc.data();
        const currentIds: string[] = userData?.assignmentStates?.completedIds || [];

        // Update the list
        let newIds: string[];
        if (completed) {
            // Add if not already present
            newIds = currentIds.includes(assignmentId) ? currentIds : [...currentIds, assignmentId];
        } else {
            // Remove if present
            newIds = currentIds.filter(id => id !== assignmentId);
        }

        // Save back to Firestore
        await adminDb.collection('users').doc(session.userId).update({
            'assignmentStates.completedIds': newIds,
            'assignmentStates.updatedAt': new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            completed,
            totalCompleted: newIds.length,
        });
    } catch (error) {
        console.error('[Assignment States API] PATCH Error:', error);
        return NextResponse.json({ error: 'Failed to toggle assignment state' }, { status: 500 });
    }
}
