/**
 * ICS Fetcher Service
 * Fetches and parses ICS calendar files for courses and assignments
 */
import { parseICS, VEvent } from 'node-ical';
import axios from 'axios';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);

export interface IcsEvent {
    uid: string;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    location?: string;
    isAllDay: boolean;
    recurrence?: string;
    rruleDays?: number[]; // Days of week from BYDAY (0=SU, 1=MO, etc)
}

export interface ParsedAssignment {
    id: string;
    title: string;
    dueDate: string;
    course: string;
    courseName?: string;
    description?: string;
    d2lUrl?: string;
    source: 'ics';
}

export interface ParsedCourseSession {
    day: number;
    startTime: string;
    endTime: string;
    durationHours: number;
}

export interface ParsedClassEvent {
    id: string;
    title: string;
    course: string;
    startDate: string;
    endDate: string;
    location?: string;
    type: 'class';
    dayOfWeek: number; // 0-6 (Sunday=0)
}

// Map RRULE BYDAY to day number
const BYDAY_MAP: Record<string, number> = {
    'SU': 0, 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6
};

/**
 * Parse RRULE to extract BYDAY values
 */
function parseRruleByday(rrule: string): number[] {
    const bydayMatch = rrule.match(/BYDAY=([A-Z,]+)/);
    if (!bydayMatch) return [];

    return bydayMatch[1].split(',').map(day => BYDAY_MAP[day.slice(-2)]).filter(d => d !== undefined);
}

/**
 * Parse RRULE to extract UNTIL date (when the recurring event ends)
 * Returns null if no UNTIL is specified (event recurs indefinitely)
 */
function parseRruleUntil(rrule: string): dayjs.Dayjs | null {
    // UNTIL format: UNTIL=20220131T000000 or UNTIL=20220131
    const untilMatch = rrule.match(/UNTIL=(\d{8}(?:T\d{6})?)/);
    if (!untilMatch) return null;

    const untilStr = untilMatch[1];
    // Parse the date string (YYYYMMDD or YYYYMMDDTHHMMSS)
    if (untilStr.length >= 8) {
        const year = untilStr.substring(0, 4);
        const month = untilStr.substring(4, 6);
        const day = untilStr.substring(6, 8);
        return dayjs(`${year}-${month}-${day}`);
    }
    return null;
}

/**
 * Fetch ICS data from a URL
 */
export async function fetchIcsData(icsUrl: string): Promise<string> {
    try {
        console.log('[ICS Fetcher] Fetching from:', icsUrl.substring(0, 50) + '...');
        const response = await axios.get(icsUrl, {
            timeout: 30000,
            headers: {
                'Accept': 'text/calendar',
            },
        });
        console.log('[ICS Fetcher] Received', response.data.length, 'bytes');
        return response.data;
    } catch (error) {
        console.error('Error fetching ICS data:', error);
        throw new Error(`Failed to fetch ICS from URL: ${icsUrl}`);
    }
}

/**
 * Parse ICS data and extract events
 */
export function parseIcsEvents(icsData: string): IcsEvent[] {
    const parsed = parseICS(icsData);
    const events: IcsEvent[] = [];

    for (const key in parsed) {
        const event = parsed[key];
        if (event.type !== 'VEVENT') continue;

        const vevent = event as VEvent;
        const rrule = vevent.rrule?.toString() || '';

        events.push({
            uid: vevent.uid || key,
            title: vevent.summary || 'Untitled Event',
            description: vevent.description,
            startDate: vevent.start ? dayjs(vevent.start).toISOString() : '',
            endDate: vevent.end ? dayjs(vevent.end).toISOString() : '',
            location: vevent.location,
            isAllDay: vevent.datetype === 'date',
            recurrence: rrule,
            rruleDays: parseRruleByday(rrule),
        });
    }

    console.log('[ICS Fetcher] Parsed', events.length, 'events');
    return events;
}

/**
 * Extract assignments from ICS events (D2L-style)
 * Excludes class events like lectures, labs, tutorials
 */
export function extractAssignments(events: IcsEvent[]): ParsedAssignment[] {
    const now = dayjs();
    const assignments: ParsedAssignment[] = [];

    // Keywords that indicate actual assignments (not class sessions)
    const assignmentKeywords = [
        'due', 'assignment', 'quiz', 'exam', 'test', 'midterm',
        'final', 'project', 'submission', 'deadline', 'homework',
        'paper', 'essay', 'report'
    ];

    // Keywords that indicate class sessions (should be excluded)
    const classKeywords = [
        'lecture', 'lec', 'lab', 'laboratory', 'tutorial', 'tut',
        'seminar', 'sem', 'class', 'section'
    ];

    for (const event of events) {
        const titleLower = event.title.toLowerCase();
        const descLower = (event.description || '').toLowerCase();

        // Check if this looks like a class session (lab, lecture, tutorial)
        const isClassSession = classKeywords.some(kw => titleLower.includes(kw));

        // Check if this is a recurring event (classes typically recur)
        const isRecurring = !!event.recurrence;

        // Skip if it looks like a class session
        if (isClassSession || isRecurring) {
            continue;
        }

        const isAssignment = assignmentKeywords.some(kw =>
            titleLower.includes(kw) || descLower.includes(kw)
        );

        const eventDate = dayjs(event.endDate || event.startDate);
        const isFuture = eventDate.isSameOrAfter(now, 'day');

        // Only include if it's an assignment keyword match AND future
        if (isAssignment && isFuture) {
            const courseMatch = event.title.match(/^([A-Z]{2,4}\s?\d{3}[A-Z]?)/i);
            const course = courseMatch ? courseMatch[1].toUpperCase().replace(/\s/g, '') : 'General';

            let cleanTitle = event.title;
            if (courseMatch) {
                cleanTitle = event.title.replace(courseMatch[0], '').replace(/^[\s:-]+/, '').trim();
            }

            const urlMatch = event.description?.match(/https?:\/\/[^\s<>"]+d2l[^\s<>"]+/i);

            assignments.push({
                id: `ics-${event.uid}`,
                title: cleanTitle || event.title,
                dueDate: event.endDate || event.startDate,
                course,
                description: event.description?.substring(0, 500),
                d2lUrl: urlMatch ? urlMatch[0] : undefined,
                source: 'ics',
            });
        }
    }

    return assignments.sort((a, b) =>
        dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf()
    );
}

/**
 * Extract class events from ICS events
 * For recurring events, creates separate entries for each day of the week
 */
export function extractClassEvents(events: IcsEvent[]): ParsedClassEvent[] {
    const now = dayjs();
    const sixMonthsFromNow = dayjs().add(6, 'month');
    const classEvents: ParsedClassEvent[] = [];

    for (const event of events) {
        if (event.isAllDay) continue;

        // Skip if it looks like an assignment
        const titleLower = event.title.toLowerCase();
        const isAssignment = ['due', 'assignment', 'quiz', 'exam', 'test', 'submission', 'deadline'].some(kw => titleLower.includes(kw));
        if (isAssignment) continue;

        // Try to extract course code
        const courseMatch = event.title.match(/([A-Z]{2,4}\s?\d{2,3}[A-Z]?)/i);
        const course = courseMatch ? courseMatch[1].toUpperCase().replace(/\s/g, '') : event.title.substring(0, 15);

        const eventStart = dayjs(event.startDate);
        const eventEnd = dayjs(event.endDate);
        const durationMs = eventEnd.diff(eventStart);

        // Handle recurring events - create entry for each day they occur
        if (event.recurrence && event.rruleDays && event.rruleDays.length > 0) {
            // Check if this recurring event has ended (UNTIL date in the past)
            const untilDate = parseRruleUntil(event.recurrence);
            if (untilDate && untilDate.isBefore(now)) {
                // This recurring event has ended, skip it
                continue;
            }

            const startTime = eventStart.format('HH:mm');

            for (const dayOfWeek of event.rruleDays) {
                // Find the next occurrence of this day
                let nextOccurrence = now.startOf('week').add(dayOfWeek, 'day');
                if (nextOccurrence.isBefore(now)) {
                    nextOccurrence = nextOccurrence.add(1, 'week');
                }

                // Set the time from the original event
                const [hours, minutes] = startTime.split(':').map(Number);
                const occurrenceStart = nextOccurrence.hour(hours).minute(minutes);
                const occurrenceEnd = occurrenceStart.add(durationMs, 'millisecond');

                if (occurrenceStart.isBefore(sixMonthsFromNow)) {
                    classEvents.push({
                        id: `class-${event.uid}-day${dayOfWeek}`,
                        title: event.title,
                        course,
                        startDate: occurrenceStart.toISOString(),
                        endDate: occurrenceEnd.toISOString(),
                        location: event.location,
                        type: 'class',
                        dayOfWeek,
                    });
                }
            }
        } else {
            // Non-recurring event - check if it's in the future
            if (eventStart.isAfter(now) && eventStart.isBefore(sixMonthsFromNow)) {
                classEvents.push({
                    id: `class-${event.uid}`,
                    title: event.title,
                    course,
                    startDate: event.startDate,
                    endDate: event.endDate,
                    location: event.location,
                    type: 'class',
                    dayOfWeek: eventStart.day(),
                });
            }
        }
    }

    console.log('[ICS Fetcher] Extracted', classEvents.length, 'class events');

    return classEvents.sort((a, b) =>
        dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf()
    );
}

/**
 * Extract course schedule from ICS events (recurring class sessions)
 */
export function extractCourseSchedule(events: IcsEvent[]): Map<string, ParsedCourseSession[]> {
    const courseMap = new Map<string, ParsedCourseSession[]>();

    for (const event of events) {
        const courseMatch = event.title.match(/([A-Z]{2,4}\s?\d{3}[A-Z]?)/i);
        if (!courseMatch) continue;

        const titleLower = event.title.toLowerCase();
        const isAssignment = ['due', 'assignment', 'quiz', 'exam', 'test', 'submission'].some(kw => titleLower.includes(kw));
        if (isAssignment) continue;

        const courseCode = courseMatch[1].toUpperCase().replace(/\s/g, '');
        const startDate = dayjs(event.startDate);
        const endDate = dayjs(event.endDate);
        const now = dayjs();

        // Skip expired recurring events
        if (event.recurrence) {
            const untilDate = parseRruleUntil(event.recurrence);
            if (untilDate && untilDate.isBefore(now)) {
                continue;
            }
        }

        // Use RRULE days if available, otherwise use the event's start day
        const daysToAdd = event.rruleDays && event.rruleDays.length > 0
            ? event.rruleDays
            : [startDate.day()];

        for (const day of daysToAdd) {
            const session: ParsedCourseSession = {
                day,
                startTime: startDate.format('HH:mm'),
                endTime: endDate.format('HH:mm'),
                durationHours: endDate.diff(startDate, 'hour', true),
            };

            const existing = courseMap.get(courseCode) || [];

            const isDuplicate = existing.some(s =>
                s.day === session.day &&
                s.startTime === session.startTime
            );

            if (!isDuplicate) {
                existing.push(session);
                courseMap.set(courseCode, existing);
            }
        }
    }

    console.log('[ICS Fetcher] Extracted courses:', Array.from(courseMap.keys()));
    return courseMap;
}

/**
 * Calculate total weekly class hours from course schedule
 */
export function calculateWeeklyHours(courseSchedule: Map<string, ParsedCourseSession[]>): number {
    let totalHours = 0;

    for (const sessions of courseSchedule.values()) {
        for (const session of sessions) {
            totalHours += session.durationHours;
        }
    }

    return Math.round(totalHours * 10) / 10;
}

/**
 * Fetch and parse ICS from URL
 */
export async function fetchAndParseIcs(icsUrl: string): Promise<{
    assignments: ParsedAssignment[];
    classEvents: ParsedClassEvent[];
    courseSchedule: Map<string, ParsedCourseSession[]>;
    weeklyHours: number;
}> {
    const icsData = await fetchIcsData(icsUrl);
    const events = parseIcsEvents(icsData);
    const assignments = extractAssignments(events);
    const classEvents = extractClassEvents(events);
    const courseSchedule = extractCourseSchedule(events);
    const weeklyHours = calculateWeeklyHours(courseSchedule);

    console.log('[ICS Fetcher] Results:', {
        assignments: assignments.length,
        classEvents: classEvents.length,
        courses: courseSchedule.size,
        weeklyHours
    });

    return { assignments, classEvents, courseSchedule, weeklyHours };
}

/**
 * Merge results from multiple ICS sources
 */
export async function fetchMultipleIcs(urls: string[]): Promise<{
    assignments: ParsedAssignment[];
    classEvents: ParsedClassEvent[];
    weeklyHours: number;
}> {
    const allAssignments: ParsedAssignment[] = [];
    const allClassEvents: ParsedClassEvent[] = [];
    let totalWeeklyHours = 0;

    for (const url of urls) {
        if (!url) continue;

        try {
            const result = await fetchAndParseIcs(url);
            allAssignments.push(...result.assignments);
            allClassEvents.push(...result.classEvents);
            totalWeeklyHours += result.weeklyHours;
        } catch (error) {
            console.error(`Failed to fetch ICS from ${url}:`, error);
        }
    }

    // Deduplicate assignments
    const seenAssignments = new Set<string>();
    const uniqueAssignments = allAssignments.filter(a => {
        const key = `${a.title}-${a.dueDate}`;
        if (seenAssignments.has(key)) return false;
        seenAssignments.add(key);
        return true;
    });

    // Deduplicate class events
    const seenClasses = new Set<string>();
    const uniqueClassEvents = allClassEvents.filter(c => {
        const key = `${c.course}-${c.dayOfWeek}-${dayjs(c.startDate).format('HH:mm')}`;
        if (seenClasses.has(key)) return false;
        seenClasses.add(key);
        return true;
    });

    return {
        assignments: uniqueAssignments,
        classEvents: uniqueClassEvents,
        weeklyHours: totalWeeklyHours,
    };
}
