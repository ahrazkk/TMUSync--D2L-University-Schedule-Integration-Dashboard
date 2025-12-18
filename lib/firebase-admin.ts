/**
 * Firebase Admin SDK Configuration (Server-side)
 * Used for Firestore database operations and user management
 */
import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Firebase Admin initialization (singleton pattern)
function getFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Validate required environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin credentials. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.'
    );
  }

  const serviceAccount: ServiceAccount = {
    projectId,
    clientEmail,
    privateKey,
  };

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

// Initialize Firebase Admin
const app = getFirebaseAdmin();

// Export Firestore and Auth instances
const db = getFirestore(app);

// Only set settings once (check if not already set)
try {
  db.settings({ ignoreUndefinedProperties: true });
} catch (e) {
  // Settings already applied, ignore
}

export const adminDb = db;
export const adminAuth = getAuth(app);

// Collection references
export const COLLECTIONS = {
  USERS: 'users',
} as const;
