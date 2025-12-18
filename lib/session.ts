import type { SessionOptions } from 'iron-session';

export const sessionOptions: SessionOptions = {
  // ... (no changes here)
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieName: 'unitracker-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
};

export interface SessionData {
  isLoggedIn: boolean;

  // New Firebase-based auth fields
  userId?: string;       // Firebase UID
  email?: string;        // User's email
  firstName?: string;    // User's first name for personalized greeting
  icsUrls?: string[];    // Multiple ICS URLs (D2L + Google Calendar)

  // Legacy fields (for school login if enabled)
  id?: string;           // Legacy session ID
  icsUrl?: string;       // Legacy single ICS URL
  username?: string;     // VSB username (school login)

  // Feature flag
  schoolLoginEnabled?: boolean;
}