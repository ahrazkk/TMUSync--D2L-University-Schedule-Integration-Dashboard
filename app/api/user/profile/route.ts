/**
 * User Profile API Route
 * Update user profile (name, email, password)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

interface ProfileUpdateRequest {
    firstName?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
}

export async function GET(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(cookies(), sessionOptions);

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Get user data from Firestore
        const userDoc = await adminDb.collection('users').doc(session.userId).get();
        const userData = userDoc.data();

        // Get email from Firebase Auth
        const authUser = await adminAuth.getUser(session.userId);

        return NextResponse.json({
            firstName: userData?.firstName || '',
            email: authUser.email || '',
            createdAt: userData?.createdAt,
        });
    } catch (error) {
        console.error('[Profile API] GET Error:', error);
        return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(cookies(), sessionOptions);

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body: ProfileUpdateRequest = await request.json();
        const { firstName, email, currentPassword, newPassword } = body;

        const updates: any = {};

        // Update first name in Firestore
        if (firstName && firstName.trim()) {
            await adminDb.collection('users').doc(session.userId).update({
                firstName: firstName.trim(),
                updatedAt: new Date().toISOString(),
            });

            // Update session
            session.firstName = firstName.trim();
            await session.save();

            updates.firstName = firstName.trim();
        }

        // Update email in Firebase Auth
        if (email && email.trim()) {
            try {
                await adminAuth.updateUser(session.userId, { email: email.trim() });

                // Also update in Firestore
                await adminDb.collection('users').doc(session.userId).update({
                    email: email.trim(),
                    updatedAt: new Date().toISOString(),
                });

                // Update session email
                session.email = email.trim();
                await session.save();

                updates.email = email.trim();
            } catch (error: any) {
                if (error.code === 'auth/email-already-exists') {
                    return NextResponse.json(
                        { error: 'Email is already in use by another account' },
                        { status: 400 }
                    );
                }
                throw error;
            }
        }

        // Update password in Firebase Auth
        if (newPassword) {
            if (newPassword.length < 8) {
                return NextResponse.json(
                    { error: 'Password must be at least 8 characters' },
                    { status: 400 }
                );
            }

            try {
                await adminAuth.updateUser(session.userId, { password: newPassword });
                updates.passwordChanged = true;
            } catch (error: any) {
                if (error.code === 'auth/weak-password') {
                    return NextResponse.json(
                        { error: 'Password is too weak' },
                        { status: 400 }
                    );
                }
                throw error;
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            updates,
        });
    } catch (error) {
        console.error('[Profile API] PATCH Error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
