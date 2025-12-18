/**
 * User Data API Route
 * Fetches and refreshes user data from ICS sources
 */
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { getUserData, saveCachedData } from '@/lib/user-storage';
import { fetchMultipleIcs } from '@/lib/ics-fetcher';

// GET - Fetch cached user data
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
            firstName: userData.firstName,
            icsUrls: userData.icsUrls,
            cachedData: userData.cachedData || null,
            customAssignments: userData.customAssignments || [],
            assignmentStates: userData.assignmentStates || {},
            preferences: userData.preferences || { auroraIntensity: 15, noiseOpacity: 25, enableSpotlight: false },
        });
    } catch (error) {
        console.error('[User Data API] GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }
}

// POST - Refresh data from ICS sources
export async function POST() {
    try {
        const session = await getIronSession<SessionData>(cookies(), sessionOptions);

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const userData = await getUserData(session.userId);

        if (!userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Collect ICS URLs
        const icsUrls: string[] = [];
        if (userData.icsUrls?.d2l) icsUrls.push(userData.icsUrls.d2l);
        if (userData.icsUrls?.googleCalendar) icsUrls.push(userData.icsUrls.googleCalendar);

        if (icsUrls.length === 0) {
            return NextResponse.json({
                error: 'No ICS URLs configured',
                needsSetup: true
            }, { status: 400 });
        }

        console.log('[User Data API] Fetching from', icsUrls.length, 'ICS URLs');

        // Fetch and parse ICS data 
        const { assignments, classEvents, weeklyHours } = await fetchMultipleIcs(icsUrls);

        console.log('[User Data API] Parsed:', {
            assignments: assignments.length,
            classEvents: classEvents.length,
            weeklyHours
        });

        // Build course list from assignments and class events
        const courseSet = new Set<string>();
        assignments.forEach(a => {
            if (a.course && a.course !== 'General') {
                courseSet.add(a.course);
            }
        });
        classEvents.forEach(c => {
            if (c.course) {
                courseSet.add(c.course);
            }
        });

        const courses = Array.from(courseSet).map(code => ({
            key: code,
            name: code,
            code,
            weeklyHours: 3, // Default estimate
            sessions: [],
        }));

        // Save to Firestore with class events
        await saveCachedData(session.userId, courses, assignments, weeklyHours, classEvents);

        return NextResponse.json({
            success: true,
            cachedData: {
                assignments,
                classEvents,
                courses,
                weeklyClassHours: weeklyHours,
            },
            customAssignments: userData.customAssignments || [],
            assignmentStates: userData.assignmentStates || {},
        });
    } catch (error: any) {
        console.error('[User Data API] POST Error:', error);
        console.error('[User Data API] Error stack:', error?.stack);
        console.error('[User Data API] Error message:', error?.message);
        return NextResponse.json({
            error: 'Failed to refresh data',
            details: error?.message || 'Unknown error'
        }, { status: 500 });
    }
}
