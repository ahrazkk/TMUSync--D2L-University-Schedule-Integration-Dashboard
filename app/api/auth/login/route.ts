/**
 * User Login API Route
 * Authenticates user with Firebase and creates session
 */
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { adminAuth } from '@/lib/firebase-admin';
import { getUserData, updateLastLogin } from '@/lib/user-storage';

// Firebase REST API for password verification
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const FIREBASE_AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;

interface LoginRequest {
    email: string;
    password: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: LoginRequest = await request.json();
        const { email, password } = body;

        // Validation
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Verify password using Firebase REST API
        let firebaseAuthResponse;
        try {
            const authResponse = await fetch(FIREBASE_AUTH_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    returnSecureToken: true,
                }),
            });

            firebaseAuthResponse = await authResponse.json();

            if (!authResponse.ok) {
                // Firebase returns specific error codes
                const errorCode = firebaseAuthResponse.error?.message;
                if (errorCode === 'EMAIL_NOT_FOUND' || errorCode === 'INVALID_PASSWORD' || errorCode === 'INVALID_LOGIN_CREDENTIALS') {
                    return NextResponse.json(
                        { error: 'Invalid email or password' },
                        { status: 401 }
                    );
                }
                throw new Error(errorCode || 'Authentication failed');
            }
        } catch (fetchError: any) {
            console.error('[Login API] Firebase Auth Error:', fetchError);
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // User authenticated - get their UID
        const userId = firebaseAuthResponse.localId;

        // Get user data from Firestore
        const userData = await getUserData(userId);

        if (!userData) {
            return NextResponse.json(
                { error: 'User account not found in database' },
                { status: 404 }
            );
        }

        // Update last login
        await updateLastLogin(userId);

        // Create session
        const session = await getIronSession<SessionData>(cookies(), sessionOptions);
        session.isLoggedIn = true;
        session.userId = userId;
        session.email = email;
        session.firstName = userData.firstName;
        session.icsUrls = userData.icsUrls
            ? [userData.icsUrls.d2l, userData.icsUrls.googleCalendar].filter(Boolean) as string[]
            : [];
        await session.save();

        return NextResponse.json({
            success: true,
            message: 'Login successful',
            user: {
                id: userId,
                email,
                firstName: userData.firstName,
            },
            cachedData: userData.cachedData || null,
        });
    } catch (error) {
        console.error('[Login API] Error:', error);
        return NextResponse.json(
            { error: 'Login failed. Please try again.' },
            { status: 500 }
        );
    }
}
