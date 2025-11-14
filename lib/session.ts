import type { SessionOptions } from 'iron-session';

// Generate a cryptographically secure random base64 string in both Edge and Node runtimes.
function generateRandomBase64(size = 32): string {
  // Edge / browser / Web Crypto API
  try {
    if (typeof globalThis !== 'undefined' && typeof (globalThis as any).crypto?.getRandomValues === 'function') {
      const bytes = new Uint8Array(size);
      (globalThis as any).crypto.getRandomValues(bytes);

      // Convert bytes -> binary string in chunks to avoid stack limits
      let binary = '';
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        const slice = bytes.subarray(i, i + chunk);
        // Use apply + String.fromCharCode on an array copy
        binary += String.fromCharCode.apply(null, Array.prototype.slice.call(slice));
      }

      if (typeof btoa === 'function') return btoa(binary);
      // If Buffer is available (Node), use it
      if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
    }
  } catch (e) {
    // fall through to Node fallback
  }

  // Node runtime fallback (require only at runtime when available)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
    const crypto = require('crypto');
    return crypto.randomBytes(size).toString('base64');
  } catch (e) {
    // Last-resort insecure fallback (shouldn't be used normally)
    const arr = new Uint8Array(size);
    for (let i = 0; i < size; i++) arr[i] = Math.floor(Math.random() * 256);
    if (typeof btoa === 'function') {
      let binary = '';
      for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
      return btoa(binary);
    }
    if (typeof Buffer !== 'undefined') return Buffer.from(arr).toString('base64');
    return 'dev-secret-' + Math.random().toString(36).slice(2);
  }
}

// Read password from either SECRET_COOKIE_PASSWORD (preferred) or SESSION_SECRET (legacy/.env.local)
let cookiePassword = process.env.SECRET_COOKIE_PASSWORD ?? process.env.SESSION_SECRET;

// iron-session requires a 32+ character secret. Fail fast in production.
if (!cookiePassword || cookiePassword.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Missing or invalid secret for iron-session. Set SECRET_COOKIE_PASSWORD (or SESSION_SECRET) env var with 32+ characters.'
    );
  } else {
    // For developer convenience, generate a secure random fallback so iron-session receives a valid password.
    // This avoids the "Missing password" runtime error during local development when env files aren't loaded.
    // Note: this fallback is ephemeral (in-memory) and not suitable for production.
    // eslint-disable-next-line no-console
    console.warn(
      'Warning: SECRET_COOKIE_PASSWORD (or SESSION_SECRET) is not set or is too short. Generating an ephemeral 32-byte secret for development only.'
    );
    cookiePassword = generateRandomBase64(32);
  }
}

export const sessionOptions: SessionOptions = {
  password: cookiePassword as string,
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
  username?: string; // VSB username for stable user identification
}