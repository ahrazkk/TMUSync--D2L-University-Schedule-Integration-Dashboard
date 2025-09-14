# TMUSync: A Full-Stack University Schedule & D2L Integration Dashboard# University Assignment Tracker v2# TMUSync: A Full-Stack University Schedule & D2L Integration Dashboard



**TMUSync** is a sophisticated, full-stack web application engineered to solve the problem of fragmented academic information for university students. It provides a unified, real-time dashboard by securely automating the retrieval of class schedules and D2L Brightspace assignments, presenting them in a persistent and interactive weekly calendar.



![TMUSync Dashboard Screenshot]A sophisticated Next.js 14 application that automatically scrapes and tracks university assignments from VSB (Virtual Student Board) and D2L (Desire2Learn) platforms using headless browser automation. Features real-time completion tracking, offline persistence, and an intuitive dashboard interface.**TMUSync** is a sophisticated, full-stack web application engineered to solve the problem of fragmented academic information for university students. It provides a unified, real-time dashboard by securely automating the retrieval of class schedules and D2L Brightspace assignments, presenting them in a persistent and interactive weekly calendar.



*(You should replace this with a high-quality screenshot of your final application)*



---## 🚀 Quick Start![TMUSync Dashboard Screenshot]



## Problem & Motivation*(You should replace this with a high-quality screenshot of your final application)*



University students often manage their academic responsibilities across multiple disconnected platforms: the student information system (SIS) for class schedules and the learning management system (LMS) like D2L Brightspace for assignments. This fragmentation creates a disjointed user experience, increasing the cognitive load required to stay organized.### Prerequisites



TMUSync was built to address this by creating a single source of truth. It automates the tedious process of checking multiple websites and consolidates all critical, time-sensitive information into an intuitive and persistent user interface.- Node.js 18+ (with npm/pnpm)---



---- Modern web browser (Chrome/Edge recommended for Playwright)



## Technical Deep Dive & Architecture- University VSB and D2L credentials## ## Problem & Motivation



This project leverages a modern, full-stack TypeScript architecture using Next.js, with a clear separation between the data retrieval layer and the frontend presentation layer.



### Secure, Headless Browser Automation with Playwright### InstallationUniversity students often manage their academic responsibilities across multiple disconnected platforms: the student information system (SIS) for class schedules and the learning management system (LMS) like D2L Brightspace for assignments. This fragmentation creates a disjointed user experience, increasing the cognitive load required to stay organized.



The core of the data retrieval mechanism is **Playwright**, a powerful headless browser automation library. It runs on a serverless Next.js API Route, ensuring no client-side resources are consumed during the scraping process.```bash



1. **Secure Authentication:** User credentials are submitted to a secure, server-only API endpoint. These credentials exist only in memory for the duration of the Playwright session and are never stored. The automation handles the university's CAS (Central Authentication Service) login flow, including multi-page redirects and **2FA (Duo Mobile) passcode submission**.# Clone the repositoryTMUSync was built to address this by creating a single source of truth. It automates the tedious process of checking multiple websites and consolidates all critical, time-sensitive information into an intuitive and persistent user interface.



2. **Dynamic Content Scraping:** After authenticating, Playwright navigates through the student portal, which heavily relies on dynamic JavaScript rendering and pop-up windows. It intercepts background `fetch`/XHR requests made by the portal's frontend to capture raw JSON and XML data payloads for the user's enrollment state and class data, bypassing the need for brittle DOM parsing.git clone <repository-url>



3. **ICS Feed Integration:** In parallel, the backend fetches and parses the user's D2L Brightspace calendar feed (`.ics` file) to extract all upcoming assignments, quizzes, and due dates.cd university-trackerv2---



### Session & Data Persistence Strategy



To provide a seamless user experience, TMUSync employs a dual-persistence strategy:# Install dependencies## ## Technical Deep Dive & Architecture



1. **Server-Side Session:** Upon successful authentication and data scraping, an encrypted, HTTP-only session cookie is created using **`iron-session`**. This cookie is small and contains only a session ID, confirming the user's authenticated state to the server.pnpm install



2. **Client-Side Data Caching:** The large, scraped schedule and assignment JSON object is sent to the client a single time upon login and is then stored in the browser's **`localStorage`**. When the user refreshes the page, the dashboard loads instantly from this local cache, avoiding the need to re-run the 20-30 second scraping process. The server-side session cookie is used to re-validate the user if the local cache is ever cleared.This project leverages a modern, full-stack TypeScript architecture using Next.js, with a clear separation between the data retrieval layer and the frontend presentation layer.



---# Start development server



## Project Structurepnpm dev### ### Secure, Headless Browser Automation with Playwright



The project follows the standard Next.js App Router structure, separating UI, server-side logic, and configuration.```



```The core of the data retrieval mechanism is **Playwright**, a powerful headless browser automation library. It runs on a serverless Next.js API Route, ensuring no client-side resources are consumed during the scraping process.

├── app/

│   ├── api/                  # Backend API RoutesVisit `http://localhost:3000` to access the dashboard.

│   │   ├── login/route.ts    # Handles authentication & scraping

│   │   ├── logout/route.ts   # Destroys the user session1.  **Secure Authentication:** User credentials are submitted to a secure, server-only API endpoint. These credentials exist only in memory for the duration of the Playwright session and are never stored. The automation handles the university's CAS (Central Authentication Service) login flow, including multi-page redirects and **2FA (Duo Mobile) passcode submission**.

│   │   └── schedule/route.ts # Serves cached data (fallback)

│   ├── login/page.tsx        # The client-side login form UI## 📋 Table of Contents2.  **Dynamic Content Scraping:** After authenticating, Playwright navigates through the student portal, which heavily relies on dynamic JavaScript rendering and pop-up windows. It intercepts background `fetch`/XHR requests made by the portal's frontend to capture raw JSON and XML data payloads for the user's enrollment state and class data, bypassing the need for brittle DOM parsing.

│   ├── layout.tsx            # Root layout

│   └── page.tsx              # The main dashboard page- [Architecture Overview](#architecture-overview)3.  **ICS Feed Integration:** In parallel, the backend fetches and parses the user's D2L Brightspace calendar feed (`.ics` file) to extract all upcoming assignments, quizzes, and due dates.

├── components/

│   ├── ui/                   # shadcn/ui components (Card, Button, etc.)- [Technical Stack](#technical-stack)

│   └── WeeklyCalendar.tsx    # The main interactive calendar component

├── lib/- [Core Features](#core-features)### ### Session & Data Persistence Strategy

│   ├── cache.ts              # In-memory server cache (fallback)

│   └── session.ts            # Configuration for iron-session- [API Reference](#api-reference)

├── .env.local                # Environment variables

├── middleware.ts             # Handles route protection- [Component Structure](#component-structure)To provide a seamless user experience, TMUSync employs a dual-persistence strategy:

└── tailwind.config.ts        # Tailwind CSS configuration

```- [Data Flow](#data-flow)



## Technologies Used- [Authentication System](#authentication-system)1.  **Server-Side Session:** Upon successful authentication and data scraping, an encrypted, HTTP-only session cookie is created using **`iron-session`**. This cookie is small and contains only a session ID, confirming the user's authenticated state to the server.



* **Framework:** Next.js 14 (App Router)- [Persistence Strategy](#persistence-strategy)2.  **Client-Side Data Caching:** The large, scraped schedule and assignment JSON object is sent to the client a single time upon login and is then stored in the browser's **`localStorage`**. When the user refreshes the page, the dashboard loads instantly from this local cache, avoiding the need to re-run the 20-30 second scraping process. The server-side session cookie is used to re-validate the user if the local cache is ever cleared.

* **Language:** TypeScript

* **Backend Logic:** Next.js API Routes, Playwright- [Troubleshooting](#troubleshooting)

* **Frontend:** React, Tailwind CSS

* **UI Components:** shadcn/ui, Radix UI- [Development Guide](#development-guide)---

* **Session Management:** `iron-session`

* **Data Fetching & Parsing:** `axios`, `node-ical`, `xml2js`

* **Date/Time Manipulation:** `dayjs`

* **Styling:** PostCSS, `tailwindcss-animate`## 🏗️ Architecture Overview## ## Project Structure



---



## Getting Started```The project follows the standard Next.js App Router structure, separating UI, server-side logic, and configuration.



### Prerequisites┌─────────────────────────────────────────────────────────────┐



* Node.js (v18 or later recommended)│                    Frontend (Next.js 14)                   │

* pnpm package manager (`npm install -g pnpm`)

├─────────────────────────────────────────────────────────────┤├── app/

### Installation & Setup

│  Dashboard     │  Assignment Panel  │  Weekly Calendar     ││   ├── api/                  # Backend API Routes

1. **Clone the Repository:**

   ```bash│  (page.tsx)    │  (assignments-     │  (weekly-calendar    ││   │   ├── login/route.ts    # Handles authentication & scraping

   git clone https://github.com/ahrazkk/TMUSync--D2L-University-Schedule-Integration-Dashboard.git

   cd TMUSync│                │   panel.tsx)       │   .tsx)              ││   │   ├── logout/route.ts   # Destroys the user session

   ```

├─────────────────────────────────────────────────────────────┤│   │   └── schedule/route.ts # Serves cached data (fallback)

2. **Install Dependencies:**

   This project uses `pnpm` for efficient package management.│               State Management Layer                        ││   ├── login/page.tsx        # The client-side login form UI

   ```bash

   pnpm install│  • Completion tracking with localStorage                    ││   ├── layout.tsx            # Root layout

   ```

│  • Assignment deduplication and normalization              ││   └── page.tsx              # The main dashboard page

3. **Install Playwright Browsers:**

   The first time you install, you'll need to download the browser binaries for Playwright.│  • Course binding preservation                             │├── components/

   ```bash

   pnpx playwright install├─────────────────────────────────────────────────────────────┤│   ├── ui/                   # shadcn/ui components (Card, Button, etc.)

   ```

│                  API Routes (Backend)                      ││   └── WeeklyCalendar.tsx    # The main interactive calendar component

4. **Configure Environment Variables (REQUIRED):**

   │  /api/login    │  /api/assignments  │  Session Management  │├── lib/

   ⚠️ **IMPORTANT:** You MUST create a `.env.local` file before running the development server, or you'll get an **"iron-session: Bad usage. Missing password"** error.

   ├─────────────────────────────────────────────────────────────┤│   ├── cache.ts              # In-memory server cache (fallback)

   Create a `.env.local` file in the project root:

   ```env│              Browser Automation Layer                       ││   └── session.ts            # Configuration for iron-session

   # REQUIRED: A cryptographically secure random string of at least 32 characters

   # You can generate one using: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"│  Playwright    │  VSB Scraper       │  D2L Integration     │├── .env.local                # Environment variables

   SECRET_COOKIE_PASSWORD="your-super-secure-32-character-password-here-change-this-immediately"

│  (Headless)    │  (XML Parser)      │  (ICS Parser)        │├── middleware.ts             # Handles route protection

   # OPTIONAL: The subscription link for your D2L Brightspace calendar's ICS feed

   # You can get this from your D2L calendar by right-clicking and copying the ICS subscription link├─────────────────────────────────────────────────────────────┤└── tailwind.config.ts        # Tailwind CSS configuration

   D2L_ICS_URL="your_d2l_ics_link_here"

│                External University Systems                  │

   # OPTIONAL: Development mode

   NODE_ENV="development"│  VSB Portal    │  D2L Platform      │  Course Databases    │

   ```

└─────────────────────────────────────────────────────────────┘

   **🔐 Security Note:** The `SECRET_COOKIE_PASSWORD` is used to encrypt your session data. Make sure to:

   - Use a strong, random password of at least 32 characters```

   - Never commit this password to version control

   - Generate a new one for production deployments## ## Technologies Used



5. **Run the Development Server:**## 🛠️ Technical Stack

   ```bash

   pnpm dev* **Framework:** Next.js 14 (App Router)

   ```

### Core Framework* **Language:** TypeScript

The application will be available at `http://localhost:3000`.

- **Next.js 14.2.32**: App Router with React 18+ for modern SSR/CSR* **Backend Logic:** Next.js API Routes, Playwright

---

- **TypeScript 5**: Full type safety across frontend and backend* **Frontend:** React, Tailwind CSS

## Core Features

- **Tailwind CSS 3**: Utility-first styling with responsive design* **UI Components:** shadcn/ui, Radix UI

### 1. Automated Assignment Scraping

* **Session Management:** `iron-session`

```typescript

// Simplified scraping flow from /api/login/route.ts### Browser Automation* **Data Fetching & Parsing:** `axios`, `node-ical`, `xml2js`

const browser = await playwright.chromium.launch({ headless: true });

const page = await browser.newPage();- **Playwright 1.55.0**: Headless browser automation for university portal scraping* **Date/Time Manipulation:** `dayjs`



// Multi-step authentication  - Handles complex multi-step authentication flows* **Styling:** PostCSS, `tailwindcss-animate`

await page.goto('https://cas.torontomu.ca/login');

await page.fill('#username', credentials.username);  - Supports JavaScript-heavy SPAs with dynamic content loading

await page.fill('#password', credentials.password);

await page.click('#login-button');  - Built-in screenshot and debugging capabilities---



// Extract assignments from multiple sources

const vsbAssignments = await scrapeVSBAssignments(page);

const d2lAssignments = await scrapeD2LCalendar(page);### Security & Sessions## ## Getting Started

```

- **iron-session 8.0.4**: AES-256 encrypted stateless session management

### 2. Intelligent Assignment Deduplication

  - Tamper-proof session cookies### ### Prerequisites

```typescript

// From app/page.tsx - removes duplicates across VSB and D2L  - No server-side session storage required

const uniqueAssignments = allAssignments.filter((assignment, index, self) => 

  index === self.findIndex(a =>   - Automatic encryption/decryption with rotation support* Node.js (v18 or later recommended)

    a.title.toLowerCase().trim() === assignment.title.toLowerCase().trim() &&

    a.course === assignment.course &&* pnpm package manager (`npm install -g pnpm`)

    new Date(a.dueDate).toDateString() === new Date(assignment.dueDate).toDateString()

  )### UI Components

);

```- **shadcn/ui**: Comprehensive component library built on Radix UI primitives### ### Installation & Setup



### 3. Persistent Completion Tracking- **Lucide React**: Modern icon library with tree-shaking support



```typescript- **Recharts**: Declarative charts for assignment statistics1.  **Clone the Repository:**

// Dual persistence: localStorage + server sessions

const [completedAssignmentIds, setCompletedAssignmentIds] = useState<Set<string>>(new Set());    ```bash



// Load completion state on app start### Development Tools    git clone [[https://github.com/your-username/TMUSync.git](https://github.com/your-username/TMUSync.git)](https://github.com/ahrazkk/TMUSync--D2L-University-Schedule-Integration-Dashboard.git)

useEffect(() => {

  const saved = localStorage.getItem('completedAssignments');- **ESLint + Prettier**: Code quality and formatting enforcement    cd TMUSync

  if (saved) {

    setCompletedAssignmentIds(new Set(JSON.parse(saved)));- **PostCSS**: CSS processing with modern features    ```

    setCompletionStateLoaded(true);

  }- **pnpm**: Fast, space-efficient package management

}, []);

2.  **Install Dependencies:**

// Save completion state on changes (only after loading complete)

useEffect(() => {## ✨ Core Features    This project uses `pnpm` for efficient package management.

  if (completionStateLoaded) {

    localStorage.setItem('completedAssignments',     ```bash

      JSON.stringify(Array.from(completedAssignmentIds)));

  }### 1. Automated Assignment Scraping    pnpm install

}, [completedAssignmentIds, completionStateLoaded]);

``````typescript    ```



## API Reference// Simplified scraping flow from /api/login/route.ts



### POST /api/loginconst browser = await playwright.chromium.launch({ headless: true });3.  **Install Playwright Browsers:**

Authenticates with university systems and scrapes assignment data.

const page = await browser.newPage();    The first time you install, you'll need to download the browser binaries for Playwright.

**Request Body:**

```typescript    ```bash

{

  username: string;// Multi-step authentication    pnpx playwright install

  password: string;

  twoFactorCode?: string; // For 2FA authenticationawait page.goto('https://vsb.mcmaster.ca');    ```

}

```await page.fill('#username', credentials.username);



**Response:**await page.fill('#password', credentials.password);4.  **Configure Environment Variables:**

```typescript

{await page.click('#login-button');    Create a `.env.local` file in the project root.

  success: boolean;

  schedule: (ClassEvent | Assignment)[];    ```env

  needsSetup?: boolean;

}// Extract assignments from multiple sources    # A cryptographically secure random string of at least 32 characters.

```

const vsbAssignments = await scrapeVSBAssignments(page);    SECRET_COOKIE_PASSWORD="generate_a_secure_random_string_for_this"

### GET /api/schedule

Retrieves cached schedule data from encrypted session.const d2lAssignments = await scrapeD2LCalendar(page);



**Response:**```    # The subscription link for your D2L Brightspace calendar's ICS feed.

```typescript

{    D2L_ICS_URL="your_d2l_ics_link_here"

  schedule: (ClassEvent | Assignment)[];

}### 2. Intelligent Assignment Deduplication    ```

```

```typescript

## Component Structure

// From app/page.tsx - removes duplicates across VSB and D2L5.  **Run the Development Server:**

### Core Dashboard (`app/page.tsx`)

- **Purpose**: Main application controller and state managerconst uniqueAssignments = allAssignments.filter((assignment, index, self) =>     ```bash

- **Responsibilities**:

  - Assignment loading and caching  index === self.findIndex(a =>     pnpm dev

  - Completion state management

  - User authentication flow    a.title.toLowerCase().trim() === assignment.title.toLowerCase().trim() &&    ```

  - Assignment deduplication

- **Key State**:    a.course === assignment.course &&

  ```typescript

  const [assignments, setAssignments] = useState<Assignment[]>([]);    new Date(a.dueDate).toDateString() === new Date(assignment.dueDate).toDateString()The application will be available at `http://localhost:3000`.

  const [completedAssignmentIds, setCompletedAssignmentIds] = useState<Set<string>>(new Set());

  const [completionStateLoaded, setCompletionStateLoaded] = useState(false);  )

  ```

);---

### Assignment Panel (`components/assignments-panel.tsx`)

- **Purpose**: Assignment list rendering and interaction```

- **Features**:

  - Filtered views (upcoming, completed, all)## ## Contributing

  - Individual assignment completion toggling

  - Undo functionality for completed items### 3. Persistent Completion Tracking

  - Visual status indicators

```typescriptContributions, issues, and feature requests are welcome. Feel free to check the [issues page](https://github.com/your-username/TMUSync/issues) if you want to contribute.

### Weekly Calendar (`components/weekly-calendar.tsx`)

- **Purpose**: Time-based assignment visualization// Dual persistence: localStorage + server sessions

- **Features**:

  - 7-day rolling viewconst [completedAssignmentIds, setCompletedAssignmentIds] = useState<Set<string>>(new Set());## ## License

  - Due date highlighting

  - Assignment clustering by date



## Data Flow// Load completion state on app startThis project is distributed under the MIT License. See `LICENSE` for more information.



### 1. Authentication & Scraping FlowuseEffect(() => {

```

User Credentials → API Route → Playwright Browser → University Portals → Raw Data  const saved = localStorage.getItem('completedAssignments');

                                    ↓

Assignment Parsing ← XML/ICS Processing ← Portal Responses ← Authenticated Requests  if (saved) {

                                    ↓

Encrypted Session ← Data Normalization ← Course Code Mapping ← Assignment Deduplication    setCompletedAssignmentIds(new Set(JSON.parse(saved)));

```

    setCompletionStateLoaded(true);

### 2. Client-Side State Management

```  }

Page Load → Check localStorage → Load Completion State → Fetch Assignments

                                        ↓}, []);

Assignment Display ← State Updates ← User Interactions ← Completion Toggles

                                        ↓// Save completion state on changes (only after loading complete)

localStorage Sync ← State Changes ← Completion Tracking ← Assignment UpdatesuseEffect(() => {

```  if (completionStateLoaded) {

    localStorage.setItem('completedAssignments', 

## Troubleshooting      JSON.stringify(Array.from(completedAssignmentIds)));

  }

### Common Issues}, [completedAssignmentIds, completionStateLoaded]);

```

#### 1. "iron-session: Bad usage. Missing password" Error

- **Cause**: Missing or incorrect `.env.local` file## 🔌 API Reference

- **Solution**: Create `.env.local` file with `SECRET_COOKIE_PASSWORD` as shown in step 4 above

- **Debug**: Ensure the environment variable is at least 32 characters long### POST /api/login

Authenticates with university systems and scrapes assignment data.

#### 2. "Login failed" or Authentication Errors

- **Cause**: Incorrect credentials or university system changes**Request Body:**

- **Solution**: Verify credentials manually on university portals```typescript

- **Debug**: Check browser console for Playwright errors{

  username: string;

#### 3. Assignments Not Loading  password: string;

- **Cause**: University portal structure changes or network issues  courseBindings?: Record<string, string>; // VSB course mapping

- **Solution**: Clear browser cache and retry login}

- **Debug**: Check Network tab for failed API requests```



#### 4. Completion State Resets**Response:**

- **Cause**: Race condition between loading and saving effects```typescript

- **Solution**: Ensure `completionStateLoaded` flag is working properly{

- **Debug**: Monitor console logs for "🔄 RESTORED completion state" messages  success: boolean;

  assignments: Assignment[];

### Performance Issues  message?: string;

- **Large Assignment Lists**: Implement virtual scrolling for 100+ assignments  courseBindings?: Record<string, string>;

- **Slow Authentication**: Check university portal response times}

- **Memory Usage**: Clear old localStorage data periodically```



## Development Guide**Assignment Schema:**

```typescript

### Local Development Setupinterface Assignment {

```bash  id: string;

# Install dependencies  title: string;

pnpm install  course: string;

  dueDate: string;

# Install Playwright browsers  description?: string;

pnpx playwright install  source: 'vsb' | 'd2l';

  vsbCourse?: string; // Original VSB course code

# Create .env.local file (see step 4 above)}

```

# Run development server with hot reload

pnpm dev### GET /api/assignments

Retrieves cached assignments from encrypted session.

# Build for production

pnpm build**Response:**

```typescript

# Start production server{

pnpm start  assignments: Assignment[];

  courseBindings: Record<string, string>;

# Run linting}

pnpm lint```

```

## 🧩 Component Structure

### Environment Configuration for Production

```bash### Core Dashboard (`app/page.tsx`)

# Session encryption (generate with: openssl rand -base64 32)- **Purpose**: Main application controller and state manager

SECRET_COOKIE_PASSWORD=your-production-32-byte-random-string- **Responsibilities**:

  - Assignment loading and caching

# Optional: Debug mode  - Completion state management

DEBUG=false  - User authentication flow

NODE_ENV=production  - Assignment deduplication

```- **Key State**:

  ```typescript

### Code Style Guidelines  const [assignments, setAssignments] = useState<Assignment[]>([]);

- **TypeScript**: Strict mode enabled, prefer interfaces over types  const [completedAssignmentIds, setCompletedAssignmentIds] = useState<Set<string>>(new Set());

- **Components**: Functional components with hooks  const [completionStateLoaded, setCompletionStateLoaded] = useState(false);

- **Styling**: Tailwind classes, avoid custom CSS  ```

- **Imports**: Absolute paths using `@/` prefix

### Assignment Panel (`components/assignments-panel.tsx`)

### Deployment Considerations- **Purpose**: Assignment list rendering and interaction

- **Environment Variables**: Secure session secrets and API keys- **Features**:

- **Browser Dependencies**: Ensure Playwright browser binaries are available  - Filtered views (upcoming, completed, all)

- **Memory Limits**: Configure appropriate memory for browser automation  - Individual assignment completion toggling

- **Rate Limiting**: Implement delays between university portal requests  - Undo functionality for completed items

  - Visual status indicators

## Security & Privacy

### Weekly Calendar (`components/weekly-calendar.tsx`)

- **Credentials**: Never stored on disk; exist only in memory during scraping- **Purpose**: Time-based assignment visualization

- **Session Data**: Encrypted with AES-256 using iron-session- **Features**:

- **Client Storage**: Only non-sensitive data cached in localStorage  - 7-day rolling view

- **HTTPS**: Required for production deployments  - Due date highlighting

- **CORS**: Properly configured for university domains only  - Assignment clustering by date



## Future Enhancements### Stats Cards (`components/stats-cards.tsx`)

- **Purpose**: Assignment statistics and progress tracking

### Planned Features- **Metrics**:

1. **Mobile Application**: React Native version with sync capabilities  - Total assignments count

2. **Collaborative Features**: Shared assignment lists and study groups  - Completion percentage

3. **AI Integration**: Assignment difficulty prediction and study scheduling  - Upcoming deadlines

4. **Multi-University Support**: Configurable scrapers for different institutions  - Weekly progress trends

5. **Advanced Analytics**: Detailed completion patterns and productivity insights

## 📊 Data Flow

### Technical Debt

1. **Error Handling**: More granular error types and recovery strategies### 1. Authentication & Scraping Flow

2. **Offline Support**: Service worker for full offline functionality```

3. **Testing Coverage**: Comprehensive test suite for all componentsUser Credentials → API Route → Playwright Browser → University Portals → Raw Data

4. **Performance Monitoring**: Real-time performance tracking and alerting                                    ↓

Assignment Parsing ← XML/ICS Processing ← Portal Responses ← Authenticated Requests

---                                    ↓

Encrypted Session ← Data Normalization ← Course Code Mapping ← Assignment Deduplication

## Contributing```



Contributions, issues, and feature requests are welcome. Feel free to check the [issues page](https://github.com/ahrazkk/TMUSync--D2L-University-Schedule-Integration-Dashboard/issues) if you want to contribute.### 2. Client-Side State Management

```

1. Fork the repositoryPage Load → Check localStorage → Load Completion State → Fetch Assignments

2. Create a feature branch (`git checkout -b feature/amazing-feature`)                                        ↓

3. Commit your changes (`git commit -m 'Add amazing feature'`)Assignment Display ← State Updates ← User Interactions ← Completion Toggles

4. Push to the branch (`git push origin feature/amazing-feature`)                                        ↓

5. Open a Pull RequestlocalStorage Sync ← State Changes ← Completion Tracking ← Assignment Updates

```

## License

### 3. Course Binding System

This project is distributed under the MIT License. See `LICENSE` for more information.VSB courses often have cryptic codes that need mapping to readable names:

```typescript

**⚠️ Disclaimer:** This project is for educational purposes only. Ensure compliance with your university's terms of service when using automated scraping tools.// Example binding: { "COMP_SCI_2C03_C01_2024": "Computer Science 2C03" }

const courseBindings = await loadCourseBindings();

---const readableName = courseBindings[assignment.vsbCourse] || assignment.course;

```

**Built with ❤️ for students who want to stay organized without the manual work.**
## 🔐 Authentication System

### Multi-Portal Authentication
The application handles complex authentication flows across different university systems:

1. **VSB Authentication**:
   ```typescript
   await page.goto('https://vsb.mcmaster.ca');
   await page.fill('#username', username);
   await page.fill('#password', password);
   await page.click('input[type="submit"]');
   
   // Handle potential 2FA or security questions
   await page.waitForLoadState('networkidle');
   ```

2. **D2L Integration**:
   - Automatic redirect handling from VSB to D2L
   - ICS calendar parsing for assignment extraction
   - Session persistence across both systems

### Session Security
- **Encryption**: AES-256 with automatic key rotation
- **Tampering Protection**: HMAC signatures on all session data
- **Automatic Expiry**: Configurable session timeouts
- **Stateless Design**: No server-side session storage required

## 💾 Persistence Strategy

### Dual-Layer Persistence
The application uses a sophisticated dual-persistence strategy:

1. **Client-Side (localStorage)**:
   - Immediate response for UI interactions
   - Offline capability for completion tracking
   - Survives browser restarts and page refreshes

2. **Server-Side (Encrypted Sessions)**:
   - Secure assignment data storage
   - Course binding preservation
   - Cross-device synchronization potential

### Race Condition Prevention
```typescript
// Critical fix for completion state persistence
const [completionStateLoaded, setCompletionStateLoaded] = useState(false);

// Load first, then enable saving
useEffect(() => {
  const saved = localStorage.getItem('completedAssignments');
  if (saved) {
    setCompletedAssignmentIds(new Set(JSON.parse(saved)));
  }
  setCompletionStateLoaded(true); // Enable saving only after loading
}, []);

// Save only after loading is complete
useEffect(() => {
  if (completionStateLoaded) {
    localStorage.setItem('completedAssignments', 
      JSON.stringify(Array.from(completedAssignmentIds)));
  }
}, [completedAssignmentIds, completionStateLoaded]);
```

## 🔧 Troubleshooting

### Common Issues

#### 1. "Login failed" or Authentication Errors
- **Cause**: Incorrect credentials or university system changes
- **Solution**: Verify credentials manually on university portals
- **Debug**: Check browser console for Playwright errors

#### 2. Assignments Not Loading
- **Cause**: University portal structure changes or network issues
- **Solution**: Clear browser cache and retry login
- **Debug**: Check Network tab for failed API requests

#### 3. Completion State Resets
- **Cause**: Race condition between loading and saving effects
- **Solution**: Ensure `completionStateLoaded` flag is working properly
- **Debug**: Monitor console logs for "🔄 RESTORED completion state" messages

#### 4. Course Names Show as Codes
- **Cause**: Missing or incorrect course bindings
- **Solution**: Use the course binding interface to map codes to readable names
- **Debug**: Check localStorage for `assignmentCourseBindings` data

### Debug Mode
Enable detailed logging by adding to your environment:
```bash
NODE_ENV=development
DEBUG=true
```

### Performance Issues
- **Large Assignment Lists**: Implement virtual scrolling for 100+ assignments
- **Slow Authentication**: Check university portal response times
- **Memory Usage**: Clear old localStorage data periodically

## 🚀 Development Guide

### Local Development Setup
```bash
# Install dependencies
pnpm install

# Run development server with hot reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

### Environment Configuration
Create `.env.local` for development:
```bash
# Session encryption (generate with: openssl rand -base64 32)
SESSION_SECRET=your-32-byte-random-string

# Optional: Debug mode
DEBUG=true
```

### Code Style Guidelines
- **TypeScript**: Strict mode enabled, prefer interfaces over types
- **Components**: Functional components with hooks
- **Styling**: Tailwind classes, avoid custom CSS
- **Imports**: Absolute paths using `@/` prefix

### Adding New Features

#### 1. New Assignment Sources
```typescript
// Add to /api/login/route.ts
async function scrapeNewSource(page: Page): Promise<Assignment[]> {
  await page.goto('https://new-university-system.edu');
  // Implement scraping logic
  return assignments;
}
```

#### 2. New UI Components
```typescript
// Follow shadcn/ui patterns
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function NewFeature() {
  return (
    <Card className="p-4">
      <Button variant="outline">New Action</Button>
    </Card>
  );
}
```

#### 3. Additional Persistence Layers
```typescript
// Extend assignment-persistence.ts
export async function saveToNewBackend(assignments: Assignment[]) {
  // Implement new persistence method
}
```

### Testing Strategy
- **Unit Tests**: Component behavior and utility functions
- **Integration Tests**: API routes and data flows
- **E2E Tests**: Full user authentication and assignment tracking flows
- **Manual Testing**: University portal changes and authentication flows

### Deployment Considerations
- **Environment Variables**: Secure session secrets and API keys
- **Browser Dependencies**: Ensure Playwright browser binaries are available
- **Memory Limits**: Configure appropriate memory for browser automation
- **Rate Limiting**: Implement delays between university portal requests

## 📈 Performance Optimizations

### Client-Side Optimizations
- **Assignment Deduplication**: O(n²) → O(n log n) with Map-based lookups
- **State Updates**: Batched with React 18 automatic batching
- **Component Rendering**: Memoization for expensive calculations

### Server-Side Optimizations
- **Browser Reuse**: Pool Playwright instances for multiple requests
- **Caching**: Assignment data cached in encrypted sessions
- **Request Debouncing**: Prevent rapid successive authentication attempts

### Bundle Size
- **Tree Shaking**: Automatic with Next.js 14 and ES modules
- **Code Splitting**: Route-based splitting with App Router
- **Asset Optimization**: Automatic image optimization and compression

## 🔮 Future Enhancements

### Planned Features
1. **Mobile Application**: React Native version with sync capabilities
2. **Collaborative Features**: Shared assignment lists and study groups
3. **AI Integration**: Assignment difficulty prediction and study scheduling
4. **Multi-University Support**: Configurable scrapers for different institutions
5. **Advanced Analytics**: Detailed completion patterns and productivity insights

### Technical Debt
1. **Error Handling**: More granular error types and recovery strategies
2. **Offline Support**: Service worker for full offline functionality
3. **Testing Coverage**: Comprehensive test suite for all components
4. **Performance Monitoring**: Real-time performance tracking and alerting

---

## 📝 License

This project is for educational purposes only. Ensure compliance with your university's terms of service when using automated scraping tools.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Built with ❤️ for students who want to stay organized without the manual work.**