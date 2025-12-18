/**
 * Debug script to test ICS parsing - with date analysis
 * Run with: npx tsx scripts/debug-ics.ts <ICS_URL>
 */
import { parseICS, VEvent } from 'node-ical';
import axios from 'axios';

const icsUrl = process.argv[2] || process.env.TEST_ICS_URL;

if (!icsUrl) {
    console.log('Usage: npx tsx scripts/debug-ics.ts <ICS_URL>');
    process.exit(1);
}

async function debugIcs(url: string) {
    console.log('\n🔍 Fetching ICS from:', url.substring(0, 60) + '...');

    try {
        const response = await axios.get(url, {
            timeout: 30000,
            headers: { 'Accept': 'text/calendar' },
        });

        const icsData = response.data;
        console.log('📥 Received', icsData.length, 'bytes\n');

        const parsed = parseICS(icsData);
        const events: any[] = [];

        for (const key in parsed) {
            const event = parsed[key];
            if (event.type !== 'VEVENT') continue;

            const vevent = event as VEvent;
            events.push({
                uid: vevent.uid || key,
                summary: vevent.summary || 'Untitled',
                start: vevent.start,
                end: vevent.end,
                location: vevent.location,
                rrule: vevent.rrule,
            });
        }

        console.log('📊 Total events found:', events.length);

        // Analyze date ranges
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const futureEvents = events.filter(e => e.start && new Date(e.start) > now);
        const currentMonthEvents = events.filter(e => {
            if (!e.start) return false;
            const d = new Date(e.start);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        });

        console.log('\n--- Date Analysis ---');
        console.log('Future events:', futureEvents.length);
        console.log('Current month events:', currentMonthEvents.length);

        // Show upcoming events
        console.log('\n--- Upcoming Events (first 10) ---');
        futureEvents.slice(0, 10).forEach((e, i) => {
            console.log(`${i + 1}. "${e.summary}" - ${e.start}`);
        });

        // Check for recurring events
        const recurringEvents = events.filter(e => e.rrule);
        console.log('\n--- Recurring Events Analysis ---');
        console.log('Total recurring:', recurringEvents.length);

        // Show recurring event rules
        console.log('\nSample recurring events with their rules:');
        recurringEvents.slice(0, 5).forEach((e, i) => {
            console.log(`${i + 1}. "${e.summary}"`);
            console.log(`   Original start: ${e.start}`);
            console.log(`   RRULE: ${e.rrule?.toString()}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

debugIcs(icsUrl);
