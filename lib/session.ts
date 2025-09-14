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
  id?: string; // <-- ADD THIS LINE
  icsUrl?: string; // User's D2L calendar URL
}