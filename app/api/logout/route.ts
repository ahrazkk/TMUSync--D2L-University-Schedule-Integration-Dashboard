import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

export async function POST() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  // This clears the session data and removes the cookie.
  session.destroy();

  return NextResponse.json({ success: true });
}