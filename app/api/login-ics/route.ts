import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { scheduleCache } from '@/lib/cache';
import { parseICS } from 'node-ical';
import axios from 'axios';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { cookies } from 'next/headers';

dayjs.extend(isSameOrAfter);

// Helper function to get current semester start date
function getCurrentSemesterStart(): dayjs.Dayjs {
  const now = dayjs();
  const month = now.month(); // 0-11 (0 = January)
  const year = now.year();

  // Semester 1 (Fall): September to December
  if (month >= 8 && month <= 11) {
    return dayjs(`${year}-09-01`);
  }
  // Semester 2 (Winter): January to April
  else if (month >= 0 && month <= 3) {
    return dayjs(`${year}-01-01`);
  }
  // Semester 3 (Summer): May to August
  else {
    return dayjs(`${year}-05-01`);
  }
}

// Helper function to check if an event is from current semester or future
function isCurrentOrFutureSemester(eventDate: dayjs.Dayjs): boolean {
  const semesterStart = getCurrentSemesterStart();
  return eventDate.isSameOrAfter(semesterStart, 'day');
}

// Generate a UUID using Web Crypto (Edge-safe) or Node crypto fallback
function generateUUID(): string {
  try {
    // Edge / Web Crypto API
    if (typeof globalThis !== 'undefined' && typeof (globalThis as any).crypto?.randomUUID === 'function') {
      return (globalThis as any).crypto.randomUUID();
    }
  } catch (e) {
    // fall through
  }
  
  // Node runtime fallback
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');
    return crypto.randomUUID();
  } catch (e) {
    // Last resort: generate a simple UUID-like string
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Generate random hex string for pseudo-username
function generateRandomHex(bytes = 4): string {
  try {
    // Edge / Web Crypto API
    if (typeof globalThis !== 'undefined' && typeof (globalThis as any).crypto?.getRandomValues === 'function') {
      const arr = new Uint8Array(bytes);
      (globalThis as any).crypto.getRandomValues(arr);
      return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    // fall through
  }
  
  // Node runtime fallback
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');
    return crypto.randomBytes(bytes).toString('hex');
  } catch (e) {
    // Last resort
    return Math.random().toString(16).slice(2, 2 + bytes * 2);
  }
}

// Force Node.js runtime for this route (needed for axios and node-ical)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('[API ICS] Starting ICS login process...');
    const { scheduleIcsUrl, assignmentsIcsUrl } = await request.json();
    console.log('[API ICS] Received URLs:', { 
      hasScheduleUrl: !!scheduleIcsUrl, 
      hasAssignmentsUrl: !!assignmentsIcsUrl 
    });

    // Validate that at least one ICS URL is provided
    if (!scheduleIcsUrl && !assignmentsIcsUrl) {
      return NextResponse.json(
        { success: false, message: 'At least one ICS URL is required.' },
        { status: 400 }
      );
    }

    // Basic URL validation
    if (scheduleIcsUrl && (!scheduleIcsUrl.includes('.ics') || !scheduleIcsUrl.startsWith('http'))) {
      return NextResponse.json(
        { success: false, message: 'Invalid schedule ICS URL format.' },
        { status: 400 }
      );
    }

    if (assignmentsIcsUrl && (!assignmentsIcsUrl.includes('.ics') || !assignmentsIcsUrl.startsWith('http'))) {
      return NextResponse.json(
        { success: false, message: 'Invalid assignments ICS URL format.' },
        { status: 400 }
      );
    }

    const scrapedClasses: any[] = [];
    const assignments: any[] = [];

    // --- Fetch Schedule from ICS ---
    if (scheduleIcsUrl) {
      try {
        console.log('[API ICS] Fetching schedule from ICS URL...');
        const scheduleResponse = await axios.get(scheduleIcsUrl);
        const scheduleCal = parseICS(scheduleResponse.data);

        const semesterStart = getCurrentSemesterStart();
        console.log(`[API ICS] Current semester starts: ${semesterStart.format('YYYY-MM-DD')}`);

        // Parse schedule events
        for (const key in scheduleCal) {
          if (scheduleCal[key].type === 'VEVENT') {
            const event = scheduleCal[key];
            if (event.summary && event.start && event.rrule) {
              const eventDate = dayjs(event.start);
              
              // Only include events from current semester onwards
              if (!isCurrentOrFutureSemester(eventDate)) {
                console.log(`[API ICS] Skipping past event: ${event.summary} (${eventDate.format('YYYY-MM-DD')})`);
                continue;
              }

              // This is a recurring class event
              const startTime = dayjs(event.start).format('h:mm A');
              const endTime = dayjs(event.end).format('h:mm A');
              const duration = dayjs(event.end).diff(dayjs(event.start), 'hour', true);

              // Extract course code from summary (e.g., "CPS714-021 - LEC" -> "CPS714")
              let courseName = event.summary;
              const courseMatch = event.summary.match(/^([A-Z]{2,4}\d{2,4}[A-Z]?)/);
              if (courseMatch) {
                courseName = courseMatch[1];
              }

              // Parse day of week from rrule
              // The rrule.options.byweekday array contains 0-based weekday numbers where:
              // 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday
              // We need to convert to calendar format: 1=Sunday, 2=Monday, 3=Tuesday, etc.
              let daysOfWeek: number[] = [];

              if (event.rrule?.options?.byweekday && Array.isArray(event.rrule.options.byweekday)) {
                // Map rrule weekday (0=Mon...6=Sun) to calendar day (1=Sun, 2=Mon...7=Sat)
                daysOfWeek = event.rrule.options.byweekday.map((rruleDay: number) => {
                  // rruleDay: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
                  // calendar: 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 7=Sat
                  if (rruleDay === 6) return 1; // Sunday
                  return rruleDay + 2; // Monday=2, Tuesday=3, etc.
                });
              } else {
                // Fallback: use the start date's day of week
                daysOfWeek = [dayjs(event.start).day() + 1];
              }

              console.log(`[API ICS] Processing event: ${event.summary}, RRule byweekday: ${event.rrule?.options?.byweekday}, Mapped days: ${daysOfWeek}, Time: ${startTime}`);

              // Extract the date range from rrule (dtstart and until)
              const classStartDate = event.rrule?.options?.dtstart ? dayjs(event.rrule.options.dtstart).format('YYYY-MM-DD') : eventDate.format('YYYY-MM-DD');
              const classEndDate = event.rrule?.options?.until ? dayjs(event.rrule.options.until).format('YYYY-MM-DD') : null;

              // Create a class entry for each day of the week this class occurs
              daysOfWeek.forEach(dayOfWeek => {
                scrapedClasses.push({
                  title: event.summary,
                  courseName: courseName,
                  type: 'class',
                  day: dayOfWeek,
                  startTime: startTime,
                  duration: duration,
                  location: event.location || 'TBA',
                  startDate: classStartDate,  // Add start date
                  endDate: classEndDate,      // Add end date
                  courseDetails: {
                    key: courseName,
                    code: courseName,
                    title: event.summary,
                    description: event.description || 'No description available',
                    location: event.location || 'TBA',
                    sessions: [{
                      type: 'LEC',
                      day: dayOfWeek,
                      startTime: startTime,
                      endTime: endTime,
                      duration: duration,
                      location: event.location || 'TBA'
                    }]
                  }
                });
              });
            }
          }
        }

        // Deduplicate classes that have the same course, day, and time
        // (Google Calendar sometimes creates multiple rrule entries for schedule changes)
        const uniqueClassesMap = new Map();
        for (const classItem of scrapedClasses) {
          const key = `${classItem.courseName}-${classItem.day}-${classItem.startTime}`;
          if (!uniqueClassesMap.has(key)) {
            uniqueClassesMap.set(key, classItem);
          }
        }
        scrapedClasses.length = 0;
        scrapedClasses.push(...uniqueClassesMap.values());

        console.log(`[API ICS] Deduplicated schedule events to ${scrapedClasses.length} unique classes`);
      } catch (scheduleError) {
        console.error('[API ICS] Failed to fetch or parse schedule ICS:', scheduleError);
        return NextResponse.json(
          { success: false, message: 'Failed to fetch schedule ICS. Please check the URL.' },
          { status: 400 }
        );
      }
    }

    // --- Fetch Assignments from ICS ---
    if (assignmentsIcsUrl) {
      try {
        console.log('[API ICS] Fetching assignments from ICS URL...');
        const icsResponse = await axios.get(assignmentsIcsUrl);
        const cal = parseICS(icsResponse.data);

        for (const key in cal) {
          if (cal[key].type === 'VEVENT') {
            const event = cal[key];
            if (event.summary && event.start) {
              const startDate = dayjs(event.start);
              
              // Filter: only future assignments from current semester onwards
              if (!startDate.isSameOrAfter(dayjs(), 'day')) {
                continue; // Skip past assignments
              }
              
              if (!isCurrentOrFutureSemester(startDate)) {
                console.log(`[API ICS] Skipping past semester assignment: ${event.summary} (${startDate.format('YYYY-MM-DD')})`);
                continue;
              }

              // Extract course information from the LOCATION field
              let courseCode = '';
              let courseName = '';
              let fullCourseInfo = '';

              if (event.location && typeof event.location === 'string') {
                fullCourseInfo = event.location;

                // Extract course code
                const courseCodeMatch = fullCourseInfo.match(/^([A-Z]{2,4}\d{2,4}[A-Z]?(?:\/[A-Z]{2,4}\d{2,4}[A-Z]?)?(?:\s+\d{3}[A-Z]?)?)/);
                if (courseCodeMatch) {
                  courseCode = courseCodeMatch[1].trim();

                  // For combined course codes like "CP8307/CPS843", prefer the second one
                  if (courseCode.includes('/')) {
                    const parts = courseCode.split('/');
                    courseCode = parts[parts.length - 1].trim();
                  }

                  // Remove section numbers if present
                  courseCode = courseCode.replace(/\s+\d{3}[A-Z]?$/, '');
                }

                // Extract course name
                const courseNameMatch = fullCourseInfo.match(/^[A-Z]{2,4}\d{2,4}[A-Z]?(?:\/[A-Z]{2,4}\d{2,4}[A-Z]?)?\s*(?:\d{3}[A-Z]?)?\s*-\s*([^-]+?)(?:\s*-\s*[FWS]\d{4}|$)/);
                if (courseNameMatch) {
                  courseName = courseNameMatch[1].trim();
                }
              }

              // Fallback to summary if location parsing failed
              if (!courseCode) {
                const summaryMatch = event.summary.match(/^([A-Z]{2,4}\d{3}[A-Z]?)/);
                if (summaryMatch) {
                  courseCode = summaryMatch[1];
                } else {
                  courseCode = 'UNKNOWN';
                }
              }

              assignments.push({
                type: 'assignment',
                title: event.summary,
                dueDate: startDate.toISOString(),
                course: courseCode,
                courseName: courseName || courseCode,
                fullCourseInfo: fullCourseInfo,
                description: event.description || '',
                location: event.location || '',
                priority: 'medium',
                d2lUrl: event.url || '',
                matchedFromICS: !!courseName
              });
            }
          }
        }

        console.log(`[API ICS] Parsed ${assignments.length} assignments from ICS (filtered to current semester)`);
      } catch (icsError) {
        console.error('[API ICS] Failed to fetch or parse assignments ICS:', icsError);
        return NextResponse.json(
          { success: false, message: 'Failed to fetch assignments ICS. Please check the URL.' },
          { status: 400 }
        );
      }
    }

    // Combine schedule and assignments
    const combinedSchedule = [...scrapedClasses, ...assignments];

    if (combinedSchedule.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No events found in the provided ICS URLs.' },
        { status: 400 }
      );
    }

    // Generate a unique session ID
    const sessionId = generateUUID();

    // Store the schedule data in cache
    scheduleCache.set(sessionId, combinedSchedule);

    // Save session data
    console.log('[API ICS] Login successful with ICS URLs');

    // Get session and set data
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    session.isLoggedIn = true;
    session.id = sessionId;
    session.icsUrl = assignmentsIcsUrl || '';
    session.username = 'ics-user-' + generateRandomHex(4);
    await session.save();
    
    console.log('[API ICS] Session set and saved with cookie');
    
    // Create response after session is saved
    return NextResponse.json({
      success: true,
      schedule: combinedSchedule,
      needsSetup: false
    });

  } catch (error) {
    console.error('[API ICS] Login process failed:', error);
    return NextResponse.json(
      { success: false, message: 'ICS login failed. Please check your URLs and try again.' },
      { status: 500 }
    );
  }
}
