# University Assignment Tracker v2# TMUSync: A Full-Stack University Schedule & D2L Integration Dashboard



A sophisticated Next.js 14 application that automatically scrapes and tracks university assignments from VSB (Virtual Student Board) and D2L (Desire2Learn) platforms using headless browser automation. Features real-time completion tracking, offline persistence, and an intuitive dashboard interface.**TMUSync** is a sophisticated, full-stack web application engineered to solve the problem of fragmented academic information for university students. It provides a unified, real-time dashboard by securely automating the retrieval of class schedules and D2L Brightspace assignments, presenting them in a persistent and interactive weekly calendar.



## 🚀 Quick Start![TMUSync Dashboard Screenshot]

heres a link to the flowchart: https://claude.ai/public/artifacts/b5d81d9b-9a52-46c7-b718-0697dcaf2438

### Prerequisites

- Node.js 18+ (with npm/pnpm)---

- Modern web browser (Chrome/Edge recommended for Playwright)

- University VSB and D2L credentials## ## Problem & Motivation



### InstallationUniversity students often manage their academic responsibilities across multiple disconnected platforms: the student information system (SIS) for class schedules and the learning management system (LMS) like D2L Brightspace for assignments. This fragmentation creates a disjointed user experience, increasing the cognitive load required to stay organized.

```bash

# Clone the repositoryTMUSync was built to address this by creating a single source of truth. It automates the tedious process of checking multiple websites and consolidates all critical, time-sensitive information into an intuitive and persistent user interface.

git clone <repository-url>

cd university-trackerv2---



# Install dependencies## ## Technical Deep Dive & Architecture

pnpm install

This project leverages a modern, full-stack TypeScript architecture using Next.js, with a clear separation between the data retrieval layer and the frontend presentation layer.

# Start development server

pnpm dev### ### Secure, Headless Browser Automation with Playwright

```

The core of the data retrieval mechanism is **Playwright**, a powerful headless browser automation library. It runs on a serverless Next.js API Route, ensuring no client-side resources are consumed during the scraping process.

Visit `http://localhost:3000` to access the dashboard.

1.  **Secure Authentication:** User credentials are submitted to a secure, server-only API endpoint. These credentials exist only in memory for the duration of the Playwright session and are never stored. The automation handles the university's CAS (Central Authentication Service) login flow, including multi-page redirects and **2FA (Duo Mobile) passcode submission**.

## 📋 Table of Contents2.  **Dynamic Content Scraping:** After authenticating, Playwright navigates through the student portal, which heavily relies on dynamic JavaScript rendering and pop-up windows. It intercepts background `fetch`/XHR requests made by the portal's frontend to capture raw JSON and XML data payloads for the user's enrollment state and class data, bypassing the need for brittle DOM parsing.

- [Architecture Overview](#architecture-overview)3.  **ICS Feed Integration:** In parallel, the backend fetches and parses the user's D2L Brightspace calendar feed (`.ics` file) to extract all upcoming assignments, quizzes, and due dates.

- [Technical Stack](#technical-stack)

- [Core Features](#core-features)### ### Session & Data Persistence Strategy

- [API Reference](#api-reference)

- [Component Structure](#component-structure)To provide a seamless user experience, TMUSync employs a dual-persistence strategy:

- [Data Flow](#data-flow)

- [Authentication System](#authentication-system)1.  **Server-Side Session:** Upon successful authentication and data scraping, an encrypted, HTTP-only session cookie is created using **`iron-session`**. This cookie is small and contains only a session ID, confirming the user's authenticated state to the server.

- [Persistence Strategy](#persistence-strategy)2.  **Client-Side Data Caching:** The large, scraped schedule and assignment JSON object is sent to the client a single time upon login and is then stored in the browser's **`localStorage`**. When the user refreshes the page, the dashboard loads instantly from this local cache, avoiding the need to re-run the 20-30 second scraping process. The server-side session cookie is used to re-validate the user if the local cache is ever cleared.

- [Troubleshooting](#troubleshooting)

- [Development Guide](#development-guide)---



## 🏗️ Architecture Overview## ## Project Structure



```The project follows the standard Next.js App Router structure, separating UI, server-side logic, and configuration.

┌─────────────────────────────────────────────────────────────┐

│                    Frontend (Next.js 14)                   │

├─────────────────────────────────────────────────────────────┤├── app/

│  Dashboard     │  Assignment Panel  │  Weekly Calendar     ││   ├── api/                  # Backend API Routes

│  (page.tsx)    │  (assignments-     │  (weekly-calendar    ││   │   ├── login/route.ts    # Handles authentication & scraping

│                │   panel.tsx)       │   .tsx)              ││   │   ├── logout/route.ts   # Destroys the user session

├─────────────────────────────────────────────────────────────┤│   │   └── schedule/route.ts # Serves cached data (fallback)

│               State Management Layer                        ││   ├── login/page.tsx        # The client-side login form UI

│  • Completion tracking with localStorage                    ││   ├── layout.tsx            # Root layout

│  • Assignment deduplication and normalization              ││   └── page.tsx              # The main dashboard page

│  • Course binding preservation                             │├── components/

├─────────────────────────────────────────────────────────────┤│   ├── ui/                   # shadcn/ui components (Card, Button, etc.)

│                  API Routes (Backend)                      ││   └── WeeklyCalendar.tsx    # The main interactive calendar component

│  /api/login    │  /api/assignments  │  Session Management  │├── lib/

├─────────────────────────────────────────────────────────────┤│   ├── cache.ts              # In-memory server cache (fallback)

│              Browser Automation Layer                       ││   └── session.ts            # Configuration for iron-session

│  Playwright    │  VSB Scraper       │  D2L Integration     │├── .env.local                # Environment variables

│  (Headless)    │  (XML Parser)      │  (ICS Parser)        │├── middleware.ts             # Handles route protection

├─────────────────────────────────────────────────────────────┤└── tailwind.config.ts        # Tailwind CSS configuration

│                External University Systems                  │

│  VSB Portal    │  D2L Platform      │  Course Databases    │

└─────────────────────────────────────────────────────────────┘

```

## ## Technologies Used

## 🛠️ Technical Stack

* **Framework:** Next.js 14 (App Router)

### Core Framework* **Language:** TypeScript

- **Next.js 14.2.32**: App Router with React 18+ for modern SSR/CSR* **Backend Logic:** Next.js API Routes, Playwright

- **TypeScript 5**: Full type safety across frontend and backend* **Frontend:** React, Tailwind CSS

- **Tailwind CSS 3**: Utility-first styling with responsive design* **UI Components:** shadcn/ui, Radix UI

* **Session Management:** `iron-session`

### Browser Automation* **Data Fetching & Parsing:** `axios`, `node-ical`, `xml2js`

- **Playwright 1.55.0**: Headless browser automation for university portal scraping* **Date/Time Manipulation:** `dayjs`

  - Handles complex multi-step authentication flows* **Styling:** PostCSS, `tailwindcss-animate`

  - Supports JavaScript-heavy SPAs with dynamic content loading

  - Built-in screenshot and debugging capabilities---



### Security & Sessions## ## Getting Started

- **iron-session 8.0.4**: AES-256 encrypted stateless session management

  - Tamper-proof session cookies### ### Prerequisites

  - No server-side session storage required

  - Automatic encryption/decryption with rotation support* Node.js (v18 or later recommended)

* pnpm package manager (`npm install -g pnpm`)

### UI Components

- **shadcn/ui**: Comprehensive component library built on Radix UI primitives### ### Installation & Setup

- **Lucide React**: Modern icon library with tree-shaking support

- **Recharts**: Declarative charts for assignment statistics1.  **Clone the Repository:**

    ```bash

### Development Tools    git clone [[https://github.com/your-username/TMUSync.git](https://github.com/your-username/TMUSync.git)](https://github.com/ahrazkk/TMUSync--D2L-University-Schedule-Integration-Dashboard.git)

- **ESLint + Prettier**: Code quality and formatting enforcement    cd TMUSync

- **PostCSS**: CSS processing with modern features    ```

- **pnpm**: Fast, space-efficient package management

2.  **Install Dependencies:**

## ✨ Core Features    This project uses `pnpm` for efficient package management.

    ```bash

### 1. Automated Assignment Scraping    pnpm install

```typescript    ```

// Simplified scraping flow from /api/login/route.ts

const browser = await playwright.chromium.launch({ headless: true });3.  **Install Playwright Browsers:**

const page = await browser.newPage();    The first time you install, you'll need to download the browser binaries for Playwright.

    ```bash

// Multi-step authentication    pnpx playwright install

await page.goto('https://vsb.mcmaster.ca');    ```

await page.fill('#username', credentials.username);

await page.fill('#password', credentials.password);4.  **Configure Environment Variables:**

await page.click('#login-button');    Create a `.env.local` file in the project root.

    ```env

// Extract assignments from multiple sources    # A cryptographically secure random string of at least 32 characters.

const vsbAssignments = await scrapeVSBAssignments(page);    SECRET_COOKIE_PASSWORD="generate_a_secure_random_string_for_this"

const d2lAssignments = await scrapeD2LCalendar(page);

```    # The subscription link for your D2L Brightspace calendar's ICS feed.

    D2L_ICS_URL="your_d2l_ics_link_here"

### 2. Intelligent Assignment Deduplication    ```

```typescript

// From app/page.tsx - removes duplicates across VSB and D2L5.  **Run the Development Server:**

const uniqueAssignments = allAssignments.filter((assignment, index, self) =>     ```bash

  index === self.findIndex(a =>     pnpm dev

    a.title.toLowerCase().trim() === assignment.title.toLowerCase().trim() &&    ```

    a.course === assignment.course &&

    new Date(a.dueDate).toDateString() === new Date(assignment.dueDate).toDateString()The application will be available at `http://localhost:3000`.

  )

);---

```

## ## Contributing

### 3. Persistent Completion Tracking

```typescriptContributions, issues, and feature requests are welcome. Feel free to check the [issues page](https://github.com/your-username/TMUSync/issues) if you want to contribute.

// Dual persistence: localStorage + server sessions

const [completedAssignmentIds, setCompletedAssignmentIds] = useState<Set<string>>(new Set());## ## License



// Load completion state on app startThis project is distributed under the MIT License. See `LICENSE` for more information.

useEffect(() => {

  const saved = localStorage.getItem('completedAssignments');

  if (saved) {

    setCompletedAssignmentIds(new Set(JSON.parse(saved)));

    setCompletionStateLoaded(true);

  }

}, []);

// Save completion state on changes (only after loading complete)
useEffect(() => {
  if (completionStateLoaded) {
    localStorage.setItem('completedAssignments', 
      JSON.stringify(Array.from(completedAssignmentIds)));
  }
}, [completedAssignmentIds, completionStateLoaded]);
```

## 🔌 API Reference

### POST /api/login
Authenticates with university systems and scrapes assignment data.

**Request Body:**
```typescript
{
  username: string;
  password: string;
  courseBindings?: Record<string, string>; // VSB course mapping
}
```

**Response:**
```typescript
{
  success: boolean;
  assignments: Assignment[];
  message?: string;
  courseBindings?: Record<string, string>;
}
```

**Assignment Schema:**
```typescript
interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  description?: string;
  source: 'vsb' | 'd2l';
  vsbCourse?: string; // Original VSB course code
}
```

### GET /api/assignments
Retrieves cached assignments from encrypted session.

**Response:**
```typescript
{
  assignments: Assignment[];
  courseBindings: Record<string, string>;
}
```

## 🧩 Component Structure

### Core Dashboard (`app/page.tsx`)
- **Purpose**: Main application controller and state manager
- **Responsibilities**:
  - Assignment loading and caching
  - Completion state management
  - User authentication flow
  - Assignment deduplication
- **Key State**:
  ```typescript
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [completedAssignmentIds, setCompletedAssignmentIds] = useState<Set<string>>(new Set());
  const [completionStateLoaded, setCompletionStateLoaded] = useState(false);
  ```

### Assignment Panel (`components/assignments-panel.tsx`)
- **Purpose**: Assignment list rendering and interaction
- **Features**:
  - Filtered views (upcoming, completed, all)
  - Individual assignment completion toggling
  - Undo functionality for completed items
  - Visual status indicators

### Weekly Calendar (`components/weekly-calendar.tsx`)
- **Purpose**: Time-based assignment visualization
- **Features**:
  - 7-day rolling view
  - Due date highlighting
  - Assignment clustering by date

### Stats Cards (`components/stats-cards.tsx`)
- **Purpose**: Assignment statistics and progress tracking
- **Metrics**:
  - Total assignments count
  - Completion percentage
  - Upcoming deadlines
  - Weekly progress trends

## 📊 Data Flow

### 1. Authentication & Scraping Flow
```
User Credentials → API Route → Playwright Browser → University Portals → Raw Data
                                    ↓
Assignment Parsing ← XML/ICS Processing ← Portal Responses ← Authenticated Requests
                                    ↓
Encrypted Session ← Data Normalization ← Course Code Mapping ← Assignment Deduplication
```

### 2. Client-Side State Management
```
Page Load → Check localStorage → Load Completion State → Fetch Assignments
                                        ↓
Assignment Display ← State Updates ← User Interactions ← Completion Toggles
                                        ↓
localStorage Sync ← State Changes ← Completion Tracking ← Assignment Updates
```

### 3. Course Binding System
VSB courses often have cryptic codes that need mapping to readable names:
```typescript
// Example binding: { "COMP_SCI_2C03_C01_2024": "Computer Science 2C03" }
const courseBindings = await loadCourseBindings();
const readableName = courseBindings[assignment.vsbCourse] || assignment.course;
```

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
