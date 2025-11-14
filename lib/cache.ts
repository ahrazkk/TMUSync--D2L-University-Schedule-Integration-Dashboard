// This is a simple in-memory cache.
// The data will be cleared if the server restarts.
export const scheduleCache = new Map<string, any[]>();