import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';

interface CompletedAssignment {
  title: string;
  course: string;
  completedDate: string;
  grade?: string;
}

interface AssignmentCompletionData {
  ids: string[];
  assignments: CompletedAssignment[];
}

// Use a Map that persists across server restarts (in production, this would be a database)
// For now, we'll use a simple JSON file approach via localStorage simulation
const STORAGE_KEY = 'PERSISTENT_ASSIGNMENT_COMPLETIONS';

// Simulate persistent storage with a global Map that doesn't reset
const globalStorage = new Map<string, AssignmentCompletionData>();

// Data cleanup configuration
const CLEANUP_CONFIG = {
  MAX_USERS: 1000, // Maximum number of users to store
  CLEANUP_INTERVAL_MS: 24 * 60 * 60 * 1000, // 24 hours
  MAX_AGE_MS: 90 * 24 * 60 * 60 * 1000, // 90 days
};

// Track user access times for cleanup
const userAccessTimes = new Map<string, number>();

// Helper to create stable user identifier from VSB username
const getUserIdentifier = (username: string): string => {
  return createHash('sha256').update(username).digest('hex');
};

// Helper to get storage key for user
const getUserStorageKey = (username: string) => `${STORAGE_KEY}_${getUserIdentifier(username)}`;

// Data cleanup function
const cleanupOldData = () => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  // Find old entries
  userAccessTimes.forEach((lastAccess, userId) => {
    if (now - lastAccess > CLEANUP_CONFIG.MAX_AGE_MS) {
      keysToDelete.push(userId);
    }
  });
  
  // If still too many users, remove oldest ones
  if (userAccessTimes.size > CLEANUP_CONFIG.MAX_USERS) {
    const sortedUsers = Array.from(userAccessTimes.entries())
      .sort(([,a], [,b]) => a - b) // Sort by access time (oldest first)
      .slice(0, userAccessTimes.size - CLEANUP_CONFIG.MAX_USERS);
    
    sortedUsers.forEach(([userId]) => keysToDelete.push(userId));
  }
  
  // Remove old data
  keysToDelete.forEach(userId => {
    const storageKey = `${STORAGE_KEY}_${userId}`;
    globalStorage.delete(storageKey);
    userAccessTimes.delete(userId);
  });
  
  if (keysToDelete.length > 0) {
    console.log(`Cleaned up ${keysToDelete.length} old user data entries`);
  }
};

// Run cleanup periodically
setInterval(cleanupOldData, CLEANUP_CONFIG.CLEANUP_INTERVAL_MS);

// Helper to save to persistent storage (in real app, this would be database)
const saveToPersistentStorage = (username: string, data: AssignmentCompletionData) => {
  const userId = getUserIdentifier(username);
  globalStorage.set(getUserStorageKey(username), data);
  userAccessTimes.set(userId, Date.now()); // Update access time
  // In a real app, you'd save to database here
  console.log(`Saved completion data for user ${userId}:`, data);
};

// Helper to load from persistent storage
const loadFromPersistentStorage = (username: string): AssignmentCompletionData => {
  const userId = getUserIdentifier(username);
  const key = getUserStorageKey(username);
  userAccessTimes.set(userId, Date.now()); // Update access time
  return globalStorage.get(key) || { ids: [], assignments: [] };
};

export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    
    if (!session.isLoggedIn || !session.username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const completionData = loadFromPersistentStorage(session.username);
    console.log(`Loading completion data for user ${getUserIdentifier(session.username)}:`, completionData);

    return NextResponse.json(completionData);
  } catch (error) {
    console.error('Error fetching assignment completions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    
    if (!session.isLoggedIn || !session.username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const completionData: AssignmentCompletionData = await request.json();
    
    // Store the completion data persistently
    saveToPersistentStorage(session.username, completionData);
    console.log(`Saved completion data for user ${getUserIdentifier(session.username)}:`, completionData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving assignment completions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Debug endpoint to check server storage status (optional)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    
    if (!session.isLoggedIn || !session.username) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Return storage statistics for debugging
    return NextResponse.json({
      totalUsers: globalStorage.size,
      userAccessTimes: userAccessTimes.size,
      currentUser: getUserIdentifier(session.username),
      hasData: globalStorage.has(getUserStorageKey(session.username))
    });
  } catch (error) {
    console.error('Error getting storage status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}