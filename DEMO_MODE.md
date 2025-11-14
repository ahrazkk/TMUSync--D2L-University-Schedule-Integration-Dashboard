# Demo Mode - No Setup Required! 🎉

This version of TMUSync is configured to run in **demo mode only** - perfect for showcasing the application without any configuration.

## What This Means

✅ **No environment variables needed** - The app generates secure session secrets automatically  
✅ **No .env file required** - Works out of the box  
✅ **No credentials needed** - Credential login is disabled  
✅ **No ICS URLs needed** - Demo data is hardcoded  
✅ **No Playwright dependencies** - No browser automation required  

## What's Included

- **Demo Login**: Click the "Try Demo Mode" button on the login page
- **Hardcoded Schedule**: 11 realistic classes across 5 courses
  - CPS714 - Advanced Algorithm Design
  - CPS510 - Database Systems
  - CPS843 - Introduction to Machine Learning
  - POL507 - Canadian Politics
  - COE70A - Engineering Capstone Project
- **Hardcoded Assignments**: 11 assignments with varied due dates, priorities, and statuses
- **Personalized Name**: Enter your name when using ICS login (optional)

## Running the App

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

Visit `http://localhost:3000` and click "Try Demo Mode" to see the dashboard!

## No Personal Data

This demo version:
- Contains **NO** real student data
- Contains **NO** personal ICS links
- Contains **NO** saved credentials
- Uses **ONLY** hardcoded demo data from `/lib/demo-data.ts`

Perfect for deployment to Vercel, Netlify, or any hosting platform without worrying about secrets or environment variables!
