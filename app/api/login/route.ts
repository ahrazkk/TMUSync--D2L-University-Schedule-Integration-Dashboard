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

    const enrollmentApiUrl = /vsb\.torontomu\.ca\/api\/getEnrollmentState/;
    const [enrollmentResponse] = await Promise.all([
      vsbPage.waitForResponse(enrollmentApiUrl),
      vsbPage.goto('https://vsb.torontomu.ca/criteria.jsp')
    ]);
    const enrollmentData = await enrollmentResponse.json();

    const classDataApiUrl = /vsb\.torontomu\.ca\/api\/class-data/;
    const [classDataResponse] = await Promise.all([vsbPage.waitForResponse(classDataApiUrl)]);
    const xmlText = await classDataResponse.text();
    const classData = await parseStringPromise(xmlText, { explicitArray: false, mergeAttrs: true });
    
    const enrolledKeys = enrollmentData.cnfs.map((cn: any) => cn.enr);
    const scrapedClasses: any[] = [];
    const courses = classData?.addcourse?.classdata?.course ? (Array.isArray(classData.addcourse.classdata.course) ? classData.addcourse.classdata.course : [classData.addcourse.classdata.course]) : [];

    courses.forEach((course: any) => {
        if (!course.uselection) return;
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
                        scrapedClasses.push({
                            title: `${course.key} - ${block.type}`,
                            courseName: course.key,
                            type: 'class',
                            day: parseInt(blockTimes.day),
                            startTime: formatTime(parseInt(blockTimes.t1)),
                            duration: (parseInt(blockTimes.t2) - parseInt(blockTimes.t1)) / 60, // duration in hours
                        });
                    }
                });
            });
        });
    });
    
    // --- Fetch Assignments from ICS ---
    let assignments: any[] = [];
    try {
      // Use user's ICS URL if available, otherwise fall back to env variable
      const icsUrl = session.icsUrl || process.env.D2L_ICS_URL as string;
      
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
                assignments.push({
                  type: 'assignment',
                  title: event.summary,
                  dueDate: startDate.toISOString(),
                  course: event.summary.split(' ')[0], // Best guess for course name
                  priority: 'medium', // Default priority,
                });
              }
            }
          }
        }
      }
    } catch (icsError) {
      console.error('Failed to fetch or parse ICS feed:', icsError);
    }
    
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

  // 4. Check if user needs ICS setup
  const needsSetup = !session.icsUrl && !process.env.D2L_ICS_URL;

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