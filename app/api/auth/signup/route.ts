/**
 * User Signup API Route
 * Creates a new user account with Firebase Auth and Firestore
 */
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { adminAuth } from '@/lib/firebase-admin';
import { createUserDocument } from '@/lib/user-storage';

interface SignupRequest {
    email: string;
    password: string;
    firstName: string;
    icsUrls?: {
        d2l?: string;
        googleCalendar?: string;
    };
}

export async function POST(request: NextRequest) {
    try {
        const body: SignupRequest = await request.json();
        const { email, password, firstName, icsUrls } = body;

        // Validation
        if (!email || !password || !firstName) {
            return NextResponse.json(
                { error: 'Email, password, and first name are required' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        if (firstName.length < 1 || firstName.length > 50) {
            return NextResponse.json(
                { error: 'First name must be between 1 and 50 characters' },
                { status: 400 }
            );
        }

        // Create user in Firebase Auth
        let firebaseUser;
        try {
            firebaseUser = await adminAuth.createUser({
                email,
                password,
                displayName: firstName,
            });
        } catch (error: any) {
            if (error.code === 'auth/email-already-exists') {
                return NextResponse.json(
                    { error: 'An account with this email already exists' },
                    { status: 409 }
                );
            }
            if (error.code === 'auth/invalid-email') {
                return NextResponse.json(
                    { error: 'Invalid email address' },
                    { status: 400 }
                );
            }
            if (error.code === 'auth/weak-password') {
                return NextResponse.json(
                    { error: 'Password is too weak' },
                    { status: 400 }
                );
            }
            throw error;
        }

        // Create user document in Firestore
        await createUserDocument(
            firebaseUser.uid,
            email,
            firstName,
            icsUrls || {}
        );

        // Create session
        const session = await getIronSession<SessionData>(cookies(), sessionOptions);
        session.isLoggedIn = true;
        session.userId = firebaseUser.uid;
        session.email = email;
        session.firstName = firstName;
        session.icsUrls = icsUrls ? [icsUrls.d2l, icsUrls.googleCalendar].filter(Boolean) as string[] : [];
        await session.save();

        return NextResponse.json({
            success: true,
            message: 'Account created successfully',
            user: {
                id: firebaseUser.uid,
                email,
                firstName,
            },
        });
    } catch (error) {
        console.error('[Signup API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to create account. Please try again.' },
            { status: 500 }
        );
    }
}
