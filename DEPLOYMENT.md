# University Tracker - Deployment Guide

## Overview
This application helps university students track their schedules and assignments by integrating with VSB (university portal) and D2L (Learning Management System) calendars.

## Features
- **Schedule Sync**: Automatically syncs class schedules from VSB
- **Assignment Tracking**: Fetches assignments from D2L ICS calendar feeds
- **Multi-User Support**: Each user can configure their own D2L calendar
- **Cross-Context Sync**: Assignment completions sync across browser contexts (normal/incognito)
- **Completion Tracking**: Mark assignments as complete with persistent storage

## Prerequisites
- Node.js 18+ and pnpm
- University VSB access (for schedule sync)
- D2L calendar subscription URL (for assignments)

## Deployment Steps

### 1. Clone and Install
```bash
git clone <repository-url>
cd university-tracker
pnpm install
```

### 2. Environment Setup
Create a `.env.local` file:
```env
# Required: Session encryption key
IRON_SESSION_PASSWORD=your-32-character-secret-key-here

# Optional: Default D2L ICS URL (fallback if users don't configure their own)
D2L_ICS_URL=https://your-d2l-instance.com/d2l/le/calendar/feed/user_123456.ics
```

### 3. Build and Run
```bash
# Development
pnpm dev

# Production
pnpm build
pnpm start
```

## User Setup Process

### First-Time User Flow
1. **Login**: Users log in with VSB credentials (username/password/2FA)
2. **Setup**: If no D2L calendar is configured, users are redirected to setup page
3. **Configure Calendar**: Users enter their D2L ICS subscription URL
4. **Dashboard**: Access full functionality with synced schedule and assignments

### Getting Your D2L ICS URL

#### Method 1: D2L Calendar Subscription
1. Log into your D2L/Brightspace account
2. Go to Calendar
3. Look for "Subscribe" or "Calendar Feed" options
4. Copy the ICS subscription URL (usually ends with `.ics`)

#### Method 2: D2L Mobile App
1. In D2L mobile app, go to Calendar
2. Look for "Subscribe to Calendar" or similar option
3. Copy the subscription URL

#### Method 3: D2L Settings
1. Go to Account Settings > Notifications
2. Look for Calendar integration options
3. Find the calendar feed/subscription URL

### URL Format Examples
```
https://your-university.brightspace.com/d2l/le/calendar/feed/user_123456.ics
https://d2l.your-university.edu/d2l/le/calendar/feed/token_abcd1234.ics
```

## Configuration Options

### Environment Variables
- `IRON_SESSION_PASSWORD`: Required 32+ character secret for session encryption
- `D2L_ICS_URL`: Optional fallback ICS URL for all users

### Per-User Configuration
- Each user can set their own D2L calendar URL via the setup page
- User settings are stored in encrypted sessions
- No database required - sessions handle all user data

## Technical Details

### Data Storage
- **Schedule Data**: Cached server-side, keyed by session ID
- **User Preferences**: Stored in encrypted iron-session cookies  
- **Assignment Completion**: Stored server-side, keyed by hashed VSB username
  - Syncs across browser contexts (normal/incognito) for same user
  - Automatic cleanup after 90 days of inactivity
  - Maximum 1000 users stored (oldest cleaned up automatically)

### Security
- Credentials never stored permanently
- Session data encrypted with iron-session
- VSB usernames hashed with SHA-256 for user identification
- Assignment completion data tied to hashed username (not plaintext)
- VSB login handled via Playwright automation
- No persistent user database required

### VSB Integration
- Scrapes class schedules using Playwright
- Parses enrollment and class data
- Groups courses by unique course keys
- Handles labs/lectures as single course units

### D2L Integration  
- Fetches assignments from ICS calendar feeds
- Parses VEVENT data for due dates
- Filters future assignments only
- Graceful fallback when calendar unavailable

## Troubleshooting

### Common Issues

**"No ICS URL configured"**
- User needs to complete setup process
- Check D2L calendar subscription is active
- Verify URL format and accessibility

**VSB Login Failed**
- Check university credentials
- Verify 2FA code timing
- University portal may be down

**Missing Assignments**
- Verify D2L calendar URL is correct
- Check if assignments are published in D2L
- Ensure calendar feed is not private

### Support
- Check browser console for detailed error messages
- Verify network connectivity to both VSB and D2L
- Test D2L ICS URL directly in browser

## Customization

### University-Specific Changes
- Update VSB selectors in `app/api/login/route.ts` if portal layout changes
- Modify course parsing logic for different university data formats
- Adjust D2L calendar parsing for institutional variations

### UI Customization
- Modify components in `components/` directory
- Update themes in `app/globals.css`
- Customize dashboard layout in `app/page.tsx`

## Deployment Platforms

### Vercel (Recommended)
```bash
pnpm install -g vercel
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

### Traditional Server
- Build application: `pnpm build`
- Copy `.next` folder and dependencies to server
- Run with PM2 or similar process manager

---

*This application is designed for educational use and requires compliance with your university's acceptable use policies.*