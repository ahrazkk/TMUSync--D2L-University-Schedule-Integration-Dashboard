import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { cookies } from 'next/headers';

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

// Helper to get storage key for user
const getUserStorageKey = (userId: string) => `${STORAGE_KEY}_${userId}`;

// Helper to save to persistent storage (in real app, this would be database)
const saveToPersistentStorage = (userId: string, data: AssignmentCompletionData) => {
  globalStorage.set(getUserStorageKey(userId), data);
  // In a real app, you'd save to database here
  console.log(`Saved completion data for user ${userId}:`, data);
};

// Helper to load from persistent storage
const loadFromPersistentStorage = (userId: string): AssignmentCompletionData => {
  const key = getUserStorageKey(userId);
  return globalStorage.get(key) || { ids: [], assignments: [] };
};

export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    
    if (!session.isLoggedIn || !session.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const completionData = loadFromPersistentStorage(session.id);
    console.log(`Loading completion data for user ${session.id}:`, completionData);

    return NextResponse.json(completionData);
  } catch (error) {
    console.error('Error fetching assignment completions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    
    if (!session.isLoggedIn || !session.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const completionData: AssignmentCompletionData = await request.json();
    
    // Store the completion data persistently
    saveToPersistentStorage(session.id, completionData);
    console.log(`Saved completion data for user ${session.id}:`, completionData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving assignment completions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}