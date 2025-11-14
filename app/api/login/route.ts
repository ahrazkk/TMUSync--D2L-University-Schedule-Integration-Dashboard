import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { scheduleCache } from '@/lib/cache';
import crypto from 'crypto';
import playwright from 'playwright';
import { parseStringPromise } from 'xml2js';
import { parseICS } from 'node-ical';
import axios from 'axios';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(weekday);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);

// Helper function to format time
function formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMins = mins < 10 ? `0${mins}` : mins;
    return `${formattedHours}:${formattedMins} ${period}`;
}

export async function POST(request: NextRequest) {
  // Use cookies() for App Router compatibility
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  const { username, password, twoFactorCode } = await request.json();
  let browser: playwright.Browser | undefined;

  try {
    console.log('[API] Launching Playwright...');
    browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('[API] Navigating to TMU CAS login...');
    await page.goto('https://cas.torontomu.ca/login?service=https%3A%2F%2Fmy.torontomu.ca%2FuPortal%2FLogin');
    
    await page.fill('input#username', username);
    await page.fill('input#password', password);
    await page.click('input[name="submit"]');

    try {
      await page.waitForSelector('input#token', { timeout: 10000 });
      console.log('[API] 2FA page detected. Submitting passcode...');
      await page.fill('input#token', twoFactorCode);
      await page.click('input[name="submit"]');
    } catch (e) {
      console.log('[API] No 2FA page or timed out.');
    }

    await page.waitForURL(/my\.torontomu\.ca\/uPortal/, { timeout: 15000 });
    console.log('[API] Successfully logged into My.torontomu.');

    // --- Scrape Schedule ---
    console.log('[API] Navigating to MyServiceHub...');
    const [sisPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('span:has-text("MyServiceHub")'),
    ]);
    await sisPage.waitForLoadState('networkidle');

    console.log('[API] Navigating to Visual Schedule Builder...');
    await sisPage.goto('https://sis.torontomu.ca/psc/csprd_6/EMPLOYEE/SA/c/RU_MENU.RU_VSB_LINK_FL.GBL');
    
    const [vsbPage] = await Promise.all([
      sisPage.waitForEvent('popup'),
      sisPage.click('a#RU_FL_DRIVED_SF_RU_VSB_LINK')
    ]);
    await vsbPage.waitForLoadState('networkidle');
    
    // Add small delay to help with server load/rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('[API] Waiting for enrollment state API response...');
    const enrollmentApiUrl = /vsb\.torontomu\.ca\/api\/getEnrollmentState/;
    const [enrollmentResponse] = await Promise.all([
      vsbPage.waitForResponse(enrollmentApiUrl, { timeout: 60000 }), // Increased to 60 seconds
      vsbPage.goto('https://vsb.torontomu.ca/criteria.jsp')
    ]);
    console.log('[API] Enrollment state API responded successfully');
    const enrollmentData = await enrollmentResponse.json();

    console.log('[API] Waiting for class data API response...');
    const classDataApiUrl = /vsb\.torontomu\.ca\/api\/class-data/;
    const [classDataResponse] = await Promise.all([vsbPage.waitForResponse(classDataApiUrl, { timeout: 60000 })]); // Increased to 60 seconds
    console.log('[API] Class data API responded successfully');
    const xmlText = await classDataResponse.text();
    const classData = await parseStringPromise(xmlText, { explicitArray: false, mergeAttrs: true });
    
    const enrolledKeys = enrollmentData.cnfs.map((cn: any) => cn.enr);
    const scrapedClasses: any[] = [];
    const courseDetails = new Map<string, any>(); // Store detailed course information
    const courses = classData?.addcourse?.classdata?.course ? (Array.isArray(classData.addcourse.classdata.course) ? classData.addcourse.classdata.course : [classData.addcourse.classdata.course]) : [];

    courses.forEach((course: any) => {
        if (!course.uselection) return;
        
        // Extract offering information (contains description, title, etc.)
        let offeringInfo = null;
        if (course.offering) {
            const offerings = Array.isArray(course.offering) ? course.offering : [course.offering];
            offeringInfo = offerings[0]; // Take the first offering for course details
        }
        
        // Store detailed course information from offering
        if (!courseDetails.has(course.key)) {
            courseDetails.set(course.key, {
                key: course.key,
                code: course.code || course.key.split('-')[0],
                number: course.number || course.key.split('-')[1],
                title: offeringInfo?.title || course.key,
                description: offeringInfo?.desc || 'No description available',
                credits: offeringInfo ? `${offeringInfo.credits || 'N/A'}` : 'N/A',
                campus: 'Toronto Metropolitan University',
                faculty: offeringInfo?.ao || 'N/A',
                sessions: [],
                allTimeSlots: []
            });
        }
        
        const uselections = Array.isArray(course.uselection) ? course.uselection : [course.uselection];
        uselections.forEach((uselection: any) => {
            if (!enrolledKeys.includes(uselection.key)) return;
            const selections = Array.isArray(uselection.selection) ? uselection.selection : [uselection.selection];
            const matchingSelection = selections.find((s: any) => s.key === uselection.key);
            if (!matchingSelection) return;

            const blocks = Array.isArray(matchingSelection.block) ? matchingSelection.block : [matchingSelection.block];
            blocks.forEach((block: any) => {
                const timeblockids = block.timeblockids.split(',');
                timeblockids.forEach((id: string) => {
                    const timeblocks = Array.isArray(uselection.timeblock) ? uselection.timeblock : [uselection.timeblock];
                    const blockTimes = timeblocks.find((tb: any) => tb.id === id);
                    if (blockTimes) {
                        const sessionInfo = {
                            type: block.type,
                            section: block.secNo || 'N/A',
                            day: parseInt(blockTimes.day),
                            startTime: formatTime(parseInt(blockTimes.t1)),
                            endTime: formatTime(parseInt(blockTimes.t2)),
                            duration: (parseInt(blockTimes.t2) - parseInt(blockTimes.t1)) / 60,
                            instructor: block.teacher || 'TBA',
                            location: block.location || 'TBA',
                            campus: block.campus || 'N/A',
                            credits: block.credits || matchingSelection.credits || 'N/A',
                            status: block.status || 'Active',
                            capacity: block.me ? `${block.os || 0}/${block.me}` : 'N/A'
                        };
                        
                        // Add to course details
                        const courseDetail = courseDetails.get(course.key);
                        if (courseDetail) {
                            courseDetail.sessions.push(sessionInfo);
                            courseDetail.allTimeSlots.push(sessionInfo);
                        }
                        
                        scrapedClasses.push({
                            title: `${course.key} - ${block.type}`,
                            courseName: course.key,
                            type: 'class',
                            day: parseInt(blockTimes.day),
                            startTime: formatTime(parseInt(blockTimes.t1)),
                            duration: (parseInt(blockTimes.t2) - parseInt(blockTimes.t1)) / 60, // duration in hours
                            courseDetails: courseDetail // Include course details with each class event
                        });
                    }
                });
            });
        });
    });
    
    // Debug logging to see course details structure
    console.log('[API] Course details captured:', Array.from(courseDetails.entries()).map(([key, details]) => ({
      key,
      title: details.title,
      description: details.description ? details.description.substring(0, 100) + '...' : 'No description',
      sessionsCount: details.sessions.length,
      faculty: details.faculty,
      firstInstructor: details.sessions[0]?.instructor || 'N/A'
    })));
    
    // Debug logging to see XML structure (first course only)
    if (courses.length > 0) {
      const firstCourse = courses[0];
      console.log('[API] Sample course XML structure:', {
        courseKey: firstCourse.key,
        hasOffering: !!firstCourse.offering,
        offeringKeys: firstCourse.offering ? Object.keys(firstCourse.offering) : [],
        hasUselection: !!firstCourse.uselection,
        sampleUselection: firstCourse.uselection ? (Array.isArray(firstCourse.uselection) ? firstCourse.uselection[0] : firstCourse.uselection) : null
      });
    }
    
    // --- Fetch Assignments from ICS ---
    let assignments: any[] = [];
    try {
      // Use user's ICS URL if available
      const icsUrl = session.icsUrl;
      
      if (!icsUrl) {
        console.log('[API] No ICS URL configured, skipping assignment fetch');
        assignments = [];
      } else {
        console.log('[API] Fetching assignments from ICS URL...');
        const icsResponse = await axios.get(icsUrl);
        const cal = parseICS(icsResponse.data);
        
        for (const key in cal) {
          if (cal[key].type === 'VEVENT') {
            const event = cal[key];
            if (event.summary && event.start) {
              const startDate = dayjs(event.start);
              if (startDate.isSameOrAfter(dayjs(), 'day')) {
                // Extract course information from the LOCATION field
                let courseCode = '';
                let courseName = '';
                let fullCourseInfo = '';
                
                // Debug: Log the raw event data for problematic assignments
                if (event.summary && (event.summary.includes('Establishment') || event.summary.includes('MCR'))) {
                  console.log(`[API] DEBUG Event:`, {
                    summary: event.summary,
                    location: event.location,
                    description: event.description,
                    rawLocation: typeof event.location,
                    allProps: Object.keys(event)
                  });
                }
                
                if (event.location && typeof event.location === 'string') {
                  fullCourseInfo = event.location;
                  
                  console.log(`[API] Processing location: "${fullCourseInfo}" for event: "${event.summary}"`);
                  
                  // Parse different location formats:
                  // "CPS714 - Software Project Management\Friday - F2025"
                  // "CP8307/CPS843 - Intro to Computer Vision - F2025"
                  // "COE70A - Engineering Capstone - F2025/W2026"
                  // "POL507 701E - Power, Change and Technology - F2025"
                  
                  // Extract course code - prioritize the LOCATION field parsing
                  // Fixed regex to properly capture course codes like COE70A, CPS843, CP8307/CPS843
                  // Updated to handle 2-4 digit course numbers (CP8307 has 4 digits)
                  const courseCodeMatch = fullCourseInfo.match(/^([A-Z]{2,4}\d{2,4}[A-Z]?(?:\/[A-Z]{2,4}\d{2,4}[A-Z]?)?(?:\s+\d{3}[A-Z]?)?)/);
                  if (courseCodeMatch) {
                    courseCode = courseCodeMatch[1].trim();
                    console.log(`[API] Extracted course code: "${courseCode}"`);
                    
                    // For combined course codes like "CP8307/CPS843", prefer the second one if it exists
                    if (courseCode.includes('/')) {
                      const parts = courseCode.split('/');
                      const originalCode = courseCode;
                      courseCode = parts[parts.length - 1].trim(); // Take the last part (CPS843)
                      console.log(`[API] Split course code: "${originalCode}" -> "${courseCode}"`);
                    }
                    
                    // Remove section numbers if present (e.g., "POL507 701E" -> "POL507")
                    const beforeSectionRemoval = courseCode;
                    courseCode = courseCode.replace(/\s+\d{3}[A-Z]?$/, '');
                    if (beforeSectionRemoval !== courseCode) {
                      console.log(`[API] Removed section: "${beforeSectionRemoval}" -> "${courseCode}"`);
                    }
                  } else {
                    console.log(`[API] No course code match found in location: "${fullCourseInfo}"`);
                  }
                  
                  // Extract course name (text between course code and semester info)
                  // Updated regex to handle COE70A and other patterns properly (2-4 digits)
                  const courseNameMatch = fullCourseInfo.match(/^[A-Z]{2,4}\d{2,4}[A-Z]?(?:\/[A-Z]{2,4}\d{2,4}[A-Z]?)?\s*(?:\d{3}[A-Z]?)?\s*-\s*([^-]+?)(?:\s*-\s*[FWS]\d{4}|$)/);
                  if (courseNameMatch) {
                    courseName = courseNameMatch[1].trim();
                    console.log(`[API] Extracted course name: "${courseName}"`);
                  } else {
                    console.log(`[API] No course name match found in location: "${fullCourseInfo}"`);
                  }
                } else {
                  console.log(`[API] No location field or location is not string for event: "${event.summary}", location type: ${typeof event.location}, location value:`, event.location);
                }
                
                // Fallback: if LOCATION parsing failed, try to extract from SUMMARY as last resort
                if (!courseCode) {
                  console.log(`[API] No course code from location, trying summary fallback for: "${event.summary}"`);
                  // Only use summary as fallback if it starts with a course-like pattern
                  const summaryMatch = event.summary.match(/^([A-Z]{2,4}\d{3}[A-Z]?)/);
                  if (summaryMatch) {
                    courseCode = summaryMatch[1];
                    console.log(`[API] Used fallback course code from summary: "${courseCode}"`);
                  } else {
                    // If no course pattern found, this might not be a course assignment
                    console.log(`[API] Warning: Could not extract course code for assignment: ${event.summary}`);
                    courseCode = 'UNKNOWN';
                  }
                }
                
                // Special debug for problematic course codes
                if (courseCode === 'CP830' || courseCode === 'UNKNOWN') {
                  console.log(`[API] PROBLEM DETECTED - courseCode: "${courseCode}", summary: "${event.summary}", location: "${event.location}", fullCourseInfo: "${fullCourseInfo}"`);
                }
                
                console.log(`[API] Final assignment data: course="${courseCode}", courseName="${courseName}", title="${event.summary}"`);
                
                assignments.push({
                  type: 'assignment',
                  title: event.summary,
                  dueDate: startDate.toISOString(),
                  course: courseCode,
                  courseName: courseName || courseCode,
                  fullCourseInfo: fullCourseInfo,
                  description: event.description || '',
                  location: event.location || '',
                  priority: 'medium', // Default priority
                  d2lUrl: event.url || '',
                  matchedFromICS: !!courseName // Indicates successful parsing from ICS location
                });
              }
            }
          }
        }
        
        console.log('[API] Parsed assignments with course info:', assignments.map(a => ({
          title: a.title,
          course: a.course,
          courseName: a.courseName,
          matchedFromICS: a.matchedFromICS
        })));
      }
    } catch (icsError) {
      console.error('Failed to fetch or parse ICS feed:', icsError);
    }
    
    // --- Match Assignments to VSB Courses ---
    // Create a mapping of course codes from VSB for better assignment matching
    const vsbCourseMap = new Map<string, any>();
    const normalizedVsbMap = new Map<string, any>(); // For normalized matching
    const calendarCoursePreference = new Map<string, string>(); // To track which course code to prefer
    
    Array.from(courseDetails.entries()).forEach(([key, details]) => {
      // Store exact VSB keys
      vsbCourseMap.set(key, details);
      
      // Store normalized versions (remove dashes, convert to uppercase)
      const normalizedKey = key.replace(/-/g, '').toUpperCase();
      normalizedVsbMap.set(normalizedKey, details);
      
      // For courses with multiple codes (e.g., "CP8307/CPS843"), store both
      if (key.includes('/')) {
        const parts = key.split('/');
        parts.forEach(part => {
          const cleanPart = part.trim().replace(/-/g, '').toUpperCase();
          vsbCourseMap.set(part.trim(), details);
          normalizedVsbMap.set(cleanPart, details);
          
          // Set preference for the calendar course code if it matches one from assignments
          assignments.forEach(assignment => {
            const normalizedAssignment = assignment.course.replace(/-/g, '').toUpperCase();
            if (normalizedAssignment === cleanPart) {
              calendarCoursePreference.set(key, part.trim());
              console.log(`[API] Calendar preference: ${key} -> prefer ${part.trim()} (matches assignment ${assignment.course})`);
            }
          });
        });
      }
      
      console.log(`[API] VSB Course mapping: ${key} -> normalized: ${normalizedKey}`);
    });
    
    // Enhance assignments with VSB course data where possible
    assignments = assignments.map(assignment => {
      let matchedCourse = null;
      let preferredCourseKey = null;
      const normalizedAssignmentCourse = assignment.course.replace(/-/g, '').toUpperCase();
      
      console.log(`[API] Matching assignment course: "${assignment.course}" (normalized: "${normalizedAssignmentCourse}")`);
      
      // Try exact match first
      if (vsbCourseMap.has(assignment.course)) {
        matchedCourse = vsbCourseMap.get(assignment.course);
        preferredCourseKey = assignment.course;
        console.log(`[API] Exact match found: ${assignment.course}`);
      } 
      // Try normalized match (handles dash differences)
      else if (normalizedVsbMap.has(normalizedAssignmentCourse)) {
        matchedCourse = normalizedVsbMap.get(normalizedAssignmentCourse);
        // Check if there's a calendar preference for this course
        for (const [vsbKey, preferredCode] of calendarCoursePreference.entries()) {
          if (normalizedVsbMap.get(normalizedAssignmentCourse) === vsbCourseMap.get(vsbKey)) {
            preferredCourseKey = preferredCode;
            console.log(`[API] Using calendar preference: ${vsbKey} -> ${preferredCode}`);
            break;
          }
        }
        if (!preferredCourseKey) {
          // Find the VSB key that matches this normalized course
          for (const [vsbKey, vsbData] of vsbCourseMap.entries()) {
            if (vsbData === matchedCourse) {
              preferredCourseKey = vsbKey;
              break;
            }
          }
        }
        console.log(`[API] Normalized match found: ${assignment.course} -> ${normalizedAssignmentCourse} -> ${preferredCourseKey}`);
      } 
      // Try partial matches for complex course codes
      else {
        for (const [vsbKey, vsbData] of normalizedVsbMap.entries()) {
          if (normalizedAssignmentCourse.includes(vsbKey) || vsbKey.includes(normalizedAssignmentCourse)) {
            matchedCourse = vsbData;
            preferredCourseKey = calendarCoursePreference.get(matchedCourse.key) || matchedCourse.key;
            console.log(`[API] Partial match found: ${assignment.course} matches ${vsbKey} -> ${preferredCourseKey}`);
            break;
          }
        }
      }
      
      if (matchedCourse) {
        return {
          ...assignment,
          vsbCourseKey: preferredCourseKey || matchedCourse.key,
          vsbCourseName: matchedCourse.title,
          matchedToVSB: true
        };
      } else {
        console.log(`[API] No VSB match found for: ${assignment.course}`);
      }
      
      return assignment;
    });
    
    console.log('[API] Assignment-to-VSB course matching completed:', assignments.map(a => ({
      title: a.title,
      course: a.course,
      vsbCourseKey: a.vsbCourseKey,
      matchedToVSB: a.matchedToVSB || false
    })));
    
    const combinedSchedule = [...scrapedClasses, ...assignments];

    // 1. Generate a unique ID for this session
    const sessionId = crypto.randomUUID();

    // 2. Store the large schedule data in our server cache with the ID
    scheduleCache.set(sessionId, combinedSchedule);
    
    // 3. Save only the small ID and login status to the cookie
  session.isLoggedIn = true;
  session.id = sessionId;
  session.username = username; // Store VSB username for stable user identification
  await session.save();

  // 4. Check if user needs ICS setup (always false for demo mode)
  const needsSetup = false;

  // Return a response with the session cookie set
return NextResponse.json({ 
  success: true, 
  schedule: combinedSchedule,
  needsSetup 
});

  } catch (error) {
    console.error('[API] Login/scraping process failed:', error);
    return NextResponse.json(
      { success: false, message: 'Login failed. Please check your credentials and 2FA code.' },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
      console.log('[API] Playwright browser closed.');
    }
  }
}