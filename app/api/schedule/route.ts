import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers'; // <-- Important: Import cookies
import { sessionOptions, SessionData } from '@/lib/session';
import { scheduleCache } from '@/lib/cache';

export async function GET() { // <-- Request object is no longer needed here
  // This is the new, correct way to read the session in an App Router API Route
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  // You can add this log to see exactly what the API is reading
  console.log("Session data in /api/schedule:", session);

  if (!session.isLoggedIn || !session.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const schedule = scheduleCache.get(session.id);

  if (!schedule) {
    return NextResponse.json({ error: 'Schedule not found or expired' }, { status: 404 });
  }

  return NextResponse.json({ schedule });
}