/**
 * Local Storage Utilities
 * 
 * Centralized management for clearing localStorage data on logout
 * to prevent demo data from persisting to real user sessions.
 */

// All localStorage keys used by the app
export const STORAGE_KEYS = {
    // Schedule and assignments
    USER_SCHEDULE: 'userSchedule',
    USER_ASSIGNMENTS: 'userAssignments',
    COURSE_BINDINGS: 'courseBindings',
    ASSIGNMENTS_METADATA: 'assignmentsMetadata',
    COMPLETED_ASSIGNMENTS: 'completedAssignments',
    COMPLETED_ASSIGNMENT_IDS: 'completedAssignmentIds',

    // Class customizations
    CLASS_CUSTOMIZATIONS: 'class_customizations',

    // Session tracking
    LAST_LOGIN: 'tmusync_last_login',
    KNOWN_ASSIGNMENTS: 'tmusync_known_assignments',
    KNOWN_CLASSES: 'tmusync_known_classes',

    // Tutorial state
    TUTORIAL_COMPLETED: 'tmusync-tutorial-completed',

    // AI config (keep this on logout for user convenience)
    // GEMINI_API_KEY: 'gemini_api_key',
    // GEMINI_MODEL: 'gemini_model',
} as const;

/**
 * Clears all app-related data from localStorage
 * Called on logout to prevent demo data from leaking to real user sessions
 */
export function clearAllAppData(): void {
    console.log('🧹 Clearing all app data from localStorage...');

    // Clear all known keys
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });

    console.log('✅ All app data cleared from localStorage');
}

/**
 * Check if we should save to localStorage
 * Returns false for demo mode to prevent demo data persistence
 */
export function shouldPersistToLocalStorage(): boolean {
    // Check if current session is demo by looking for demo indicator
    // This is a client-side check - the safest approach
    const isDemo = typeof window !== 'undefined' &&
        (window.location.search.includes('demo') ||
            sessionStorage.getItem('isDemo') === 'true');

    return !isDemo;
}

/**
 * Mark the current session as demo mode
 * Call this when entering demo mode to prevent localStorage persistence
 */
export function markDemoSession(): void {
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('isDemo', 'true');
    }
}

/**
 * Clear demo session marker
 * Called on logout
 */
export function clearDemoMarker(): void {
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('isDemo');
    }
}
