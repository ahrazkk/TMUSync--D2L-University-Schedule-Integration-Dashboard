# TMUSync: A Full-Stack University Schedule & D2L Integration Dashboard

**TMUSync** is a sophisticated, full-stack web application engineered to solve the problem of fragmented academic information for university students. It provides a unified, real-time dashboard by securely automating the retrieval of class schedules and D2L Brightspace assignments, presenting them in a persistent and interactive weekly calendar.

![TMUSync Dashboard Screenshot]
*(You should replace this with a high-quality screenshot of your final application)*

---

## ## Problem & Motivation

University students often manage their academic responsibilities across multiple disconnected platforms: the student information system (SIS) for class schedules and the learning management system (LMS) like D2L Brightspace for assignments. This fragmentation creates a disjointed user experience, increasing the cognitive load required to stay organized.

TMUSync was built to address this by creating a single source of truth. It automates the tedious process of checking multiple websites and consolidates all critical, time-sensitive information into an intuitive and persistent user interface.

---

## ## Technical Deep Dive & Architecture

This project leverages a modern, full-stack TypeScript architecture using Next.js, with a clear separation between the data retrieval layer and the frontend presentation layer.

### ### Secure, Headless Browser Automation with Playwright

The core of the data retrieval mechanism is **Playwright**, a powerful headless browser automation library. It runs on a serverless Next.js API Route, ensuring no client-side resources are consumed during the scraping process.

1.  **Secure Authentication:** User credentials are submitted to a secure, server-only API endpoint. These credentials exist only in memory for the duration of the Playwright session and are never stored. The automation handles the university's CAS (Central Authentication Service) login flow, including multi-page redirects and **2FA (Duo Mobile) passcode submission**.
2.  **Dynamic Content Scraping:** After authenticating, Playwright navigates through the student portal, which heavily relies on dynamic JavaScript rendering and pop-up windows. It intercepts background `fetch`/XHR requests made by the portal's frontend to capture raw JSON and XML data payloads for the user's enrollment state and class data, bypassing the need for brittle DOM parsing.
3.  **ICS Feed Integration:** In parallel, the backend fetches and parses the user's D2L Brightspace calendar feed (`.ics` file) to extract all upcoming assignments, quizzes, and due dates.

### ### Session & Data Persistence Strategy

To provide a seamless user experience, TMUSync employs a dual-persistence strategy:

1.  **Server-Side Session:** Upon successful authentication and data scraping, an encrypted, HTTP-only session cookie is created using **`iron-session`**. This cookie is small and contains only a session ID, confirming the user's authenticated state to the server.
2.  **Client-Side Data Caching:** The large, scraped schedule and assignment JSON object is sent to the client a single time upon login and is then stored in the browser's **`localStorage`**. When the user refreshes the page, the dashboard loads instantly from this local cache, avoiding the need to re-run the 20-30 second scraping process. The server-side session cookie is used to re-validate the user if the local cache is ever cleared.

---

## ## Project Structure

The project follows the standard Next.js App Router structure, separating UI, server-side logic, and configuration.


├── app/
│   ├── api/                  # Backend API Routes
│   │   ├── login/route.ts    # Handles authentication & scraping
│   │   ├── logout/route.ts   # Destroys the user session
│   │   └── schedule/route.ts # Serves cached data (fallback)
│   ├── login/page.tsx        # The client-side login form UI
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # The main dashboard page
├── components/
│   ├── ui/                   # shadcn/ui components (Card, Button, etc.)
│   └── WeeklyCalendar.tsx    # The main interactive calendar component
├── lib/
│   ├── cache.ts              # In-memory server cache (fallback)
│   └── session.ts            # Configuration for iron-session
├── .env.local                # Environment variables
├── middleware.ts             # Handles route protection
└── tailwind.config.ts        # Tailwind CSS configuration




## ## Technologies Used

* **Framework:** Next.js 14 (App Router)
* **Language:** TypeScript
* **Backend Logic:** Next.js API Routes, Playwright
* **Frontend:** React, Tailwind CSS
* **UI Components:** shadcn/ui, Radix UI
* **Session Management:** `iron-session`
* **Data Fetching & Parsing:** `axios`, `node-ical`, `xml2js`
* **Date/Time Manipulation:** `dayjs`
* **Styling:** PostCSS, `tailwindcss-animate`

---

## ## Getting Started

### ### Prerequisites

* Node.js (v18 or later recommended)
* pnpm package manager (`npm install -g pnpm`)

### ### Installation & Setup

1.  **Clone the Repository:**
    ```bash
    git clone [[https://github.com/your-username/TMUSync.git](https://github.com/your-username/TMUSync.git)](https://github.com/ahrazkk/TMUSync--D2L-University-Schedule-Integration-Dashboard.git)
    cd TMUSync
    ```

2.  **Install Dependencies:**
    This project uses `pnpm` for efficient package management.
    ```bash
    pnpm install
    ```

3.  **Install Playwright Browsers:**
    The first time you install, you'll need to download the browser binaries for Playwright.
    ```bash
    pnpx playwright install
    ```

4.  **Configure Environment Variables:**
    Create a `.env.local` file in the project root.
    ```env
    # A cryptographically secure random string of at least 32 characters.
    SECRET_COOKIE_PASSWORD="generate_a_secure_random_string_for_this"

    # The subscription link for your D2L Brightspace calendar's ICS feed.
    D2L_ICS_URL="your_d2l_ics_link_here"
    ```

5.  **Run the Development Server:**
    ```bash
    pnpm dev
    ```

The application will be available at `http://localhost:3000`.

---

## ## Contributing

Contributions, issues, and feature requests are welcome. Feel free to check the [issues page](https://github.com/your-username/TMUSync/issues) if you want to contribute.

## ## License

This project is distributed under the MIT License. See `LICENSE` for more information.






