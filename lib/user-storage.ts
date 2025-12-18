/**
 * User Storage Utilities
 * CRUD operations for user data in Firestore
 */
import { adminDb, COLLECTIONS } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Types
export interface UserData {
    email: string;
    firstName: string;
    createdAt: FirebaseFirestore.Timestamp;
    lastLogin: FirebaseFirestore.Timestamp;
    icsUrls: {
        d2l?: string;
        googleCalendar?: string;
    };
    cachedData?: {
        courses: Course[];
        assignments: Assignment[];
        weeklyClassHours: number;
        lastRefreshed: FirebaseFirestore.Timestamp;
    };
    customAssignments: CustomAssignment[];
    assignmentStates: Record<string, 'completed' | 'in-progress'>;
    classCustomizations?: Record<string, ClassCustomization>;
    preferences?: UserPreferences;
}

export interface UserPreferences {
    auroraIntensity: number; // 0-100
    noiseOpacity: number; // 0-100
    enableSpotlight: boolean;
}

export interface ClassCustomization {
    description?: string;
    hidden?: boolean;
    color?: string;
    linkedAssignments?: string[];
}
// ... (existing interfaces)

/**
 * Update user preferences
 */
export async function updateUserPreferences(
    userId: string,
    preferences: UserPreferences
): Promise<void> {
    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(userId);
    await userRef.update({ preferences });
}

export interface Course {
    key: string;
    name: string;
    code: string;
    weeklyHours: number;
    color?: string;
    sessions: CourseSession[];
}

export interface CourseSession {
    day: number; // 0-6 (Sunday-Saturday)
    startTime: string;
    endTime: string;
    location?: string;
    type: 'lecture' | 'lab' | 'tutorial';
}

export interface Assignment {
    id: string;
    title: string;
    dueDate: string;
    course?: string;
    courseName?: string;
    description?: string;
    source: 'ics' | 'custom';
    priority?: 'low' | 'medium' | 'high';
}

export interface CustomAssignment {
    id: string;
    title: string;
    dueDate: string;
    courseKey?: string;
    repetition: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
    priority: 'low' | 'medium' | 'high';
    createdAt: string;
}

/**
 * Create a new user document in Firestore
 */
export async function createUserDocument(
    userId: string,
    email: string,
    firstName: string,
    icsUrls: { d2l?: string; googleCalendar?: string } = {}
): Promise<void> {
    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(userId);

    await userRef.set({
        email,
        firstName,
        createdAt: FieldValue.serverTimestamp(),
        lastLogin: FieldValue.serverTimestamp(),
        icsUrls,
        customAssignments: [],
        assignmentStates: {},
    });
}

/**
 * Get user data from Firestore
 */
export async function getUserData(userId: string): Promise<UserData | null> {
    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(userId);
    const doc = await userRef.get();

    if (!doc.exists) {
        return null;
    }

    return doc.data() as UserData;
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<void> {
    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(userId);
    await userRef.update({
        lastLogin: FieldValue.serverTimestamp(),
    });
}

/**
 * Update user's ICS URLs
 */
export async function updateIcsUrls(
    userId: string,
    icsUrls: { d2l?: string; googleCalendar?: string }
): Promise<void> {
    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(userId);
    await userRef.update({ icsUrls });
}

/**
 * Save cached data (courses, assignments, class events) to Firestore
 */
export async function saveCachedData(
    userId: string,
    courses: Course[],
    assignments: Assignment[],
    weeklyClassHours?: number,
    classEvents?: any[]
): Promise<void> {
    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(userId);
    const hours = weeklyClassHours ?? courses.reduce((sum, course) => sum + course.weeklyHours, 0);

    await userRef.update({
        cachedData: {
            courses,
            assignments,
            classEvents: classEvents || [],
            weeklyClassHours: hours,
            lastRefreshed: FieldValue.serverTimestamp(),
        },
    });
}

/**
 * Update assignment state (completed/in-progress)
 */
export async function updateAssignmentState(
    userId: string,
    assignmentId: string,
    state: 'completed' | 'in-progress' | null
): Promise<void> {
    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(userId);

    if (state === null) {
        // Remove the state
        await userRef.update({
            [`assignmentStates.${assignmentId}`]: FieldValue.delete(),
        });
    } else {
        await userRef.update({
            [`assignmentStates.${assignmentId}`]: state,
        });
    }
}

/**
 * Add a custom assignment
 */
export async function addCustomAssignment(
    userId: string,
    assignment: Omit<CustomAssignment, 'id' | 'createdAt'>
): Promise<string> {
    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(userId);
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newAssignment: CustomAssignment = {
        ...assignment,
        id,
        createdAt: new Date().toISOString(),
    };

    await userRef.update({
        customAssignments: FieldValue.arrayUnion(newAssignment),
    });

    return id;
}

/**
 * Remove a custom assignment
 */
export async function removeCustomAssignment(
    userId: string,
    assignmentId: string
): Promise<void> {
    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(userId);
    const doc = await userRef.get();

    if (!doc.exists) return;

    const data = doc.data() as UserData;
    const updatedAssignments = data.customAssignments.filter(a => a.id !== assignmentId);

    await userRef.update({
        customAssignments: updatedAssignments,
    });
}

/**
 * Update user's first name
 */
export async function updateFirstName(userId: string, firstName: string): Promise<void> {
    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(userId);
    await userRef.update({ firstName });
}

/**
 * Update class customization (description, hidden state, linked assignments)
 */
export async function updateClassCustomization(
    userId: string,
    classId: string,
    customization: ClassCustomization
): Promise<void> {
    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(userId);

    // updates require dot notation for nested fields in maps to avoid overwriting map
    // but here we are storing in a map keyed by classId
    await userRef.set({
        classCustomizations: {
            [classId]: customization
        }
    }, { merge: true });
}
