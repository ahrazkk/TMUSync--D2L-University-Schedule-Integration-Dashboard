# 🌌 TMUSync V2 — Cinematic University Dashboard

**A secure, visually stunning hub for your academic life.**

TMUSync V2 is a complete rebuild of the original university dashboard, addressing critical security and reliability issues while delivering a premium, editorial-quality interface.

---

## 💡 Why This Exists

University tools are fragmented—VSB for schedules, D2L for assignments, email for announcements. These platforms were built for administration, not students. TMUSync answers: *What if your academic dashboard felt as good as a premium app?* When it looks great, you actually use it—and that means less stress and more control over your semester.

---

## 🔐 V1 vs V2: A Security-First Rebuild

### The Problem with V1

The original TMUSync used **Playwright browser automation** to log into VSB (Visual Schedule Builder) and scrape class data. While technically impressive, this approach had fundamental flaws:

| Issue | Impact |
|-------|--------|
| **Credential Storage** | Required storing real university login credentials—any breach could compromise student accounts |
| **Reliability** | VSB is only active during a ~1 month enrollment window each semester; the app failed for months at a time |
| **Ethical Concerns** | Asking users to trust a third-party app with their university credentials isn't sustainable |
| **Maintenance Burden** | University portal changes frequently broke the scraper |

### V2's Security-First Architecture

| Aspect | V1 | V2 |
|--------|----|----|
| **Authentication Method** | Playwright login automation | ICS calendar subscription links |
| **Credential Risk** | 🔴 High — stored real university logins | 🟢 None — independent accounts only |
| **Data Access** | Screen scraping with credentials | Public calendar URLs (no auth needed) |
| **Reliability** | 1 month/semester (VSB window) | All semester (ICS always active) |
| **User Accounts** | None | Firebase Auth (independent) |
| **Data Storage** | LocalStorage only | Firebase Firestore + local fallback |
| **Risk if Breached** | University accounts exposed | Only app preferences exposed |

**Key Insight:** ICS calendar links contain schedule/assignment data without requiring authentication. Even if exposed, they provide no account access—making them dramatically safer than stored credentials.

---

## ✨ The Cinematic Experience

This is not just a functional tool; it's a **"Living UI"** designed to make academic management feel premium.

### 🌟 Aurora Borealis Background
- Dynamic, animated Northern Lights effect with shifting violet, cyan, and deep blue gradients
- **Film Grain Overlay**: Adds cinematic texture and depth
- **Customizable**: Adjust intensity and opacity in Settings

### 🧲 Magnetic Liquid Borders
- **Proximity Awareness**: Cards "sense" your cursor—borders glow and pull toward your pointer
- **Interactive Flashlight**: Moving your mouse creates a spotlight effect that flows across cards
- Applied to: Weekly Schedule, Quick Actions, Stats Cards, Assignment panels

### 🃏 Tarot-Style 3D Stats Cards
- Header statistics (Weekly Hours, Assignments Done, Active Courses, Current Week) are interactive 3D cards
- **Flip Animation**: Click/tap to reveal detailed breakdowns on the back face
- Premium feel with magnetic border interactions

### 🎨 Full Dark/Light Mode
- Carefully designed color palettes for both modes
- Aurora gradients adapt to theme
- High-contrast typography for accessibility

### 📱 Mobile-First Responsive Design
- Touch-optimized UI with disabled hover effects on touch devices
- Bottom navigation for easy thumb access
- Tarot cards work with tap gestures on mobile

---

## 🛠️ Core Features

### 📅 Weekly Calendar
- Visual grid showing all enrolled classes at a glance
- Click any class to view details, location, and instructor info
- Navigate between weeks with intuitive controls

### ✏️ Full Assignment Management (CRUD)
- **Add** custom assignments with due dates and descriptions
- **Edit** existing assignments imported from D2L
- **Hide** classes or assignments you don't need to see
- **Link** assignments to specific courses for organized tracking

### 🔗 Course-Assignment Binding
- View all assignments linked to a specific course
- Understand workload distribution per class
- Navigate seamlessly between schedule and assignments

### 🔄 One-Click ICS Refresh
- Sync latest changes from D2L/Google Calendar instantly
- No need to re-enter credentials—just refresh
- Automatic deduplication of assignments

### 💾 Cloud Persistence
- All preferences, customizations, and completion states saved to Firebase
- Continue seamlessly across devices
- Local fallback ensures offline functionality

### ✅ Satisfying Completion Tracking
- Mark assignments as complete with visual feedback
- Persistent across sessions and devices
- Track your progress throughout the semester

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Firebase project (for authentication and data storage)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/ahrazkk/TMUSync--D2L-University-Schedule-Integration-Dashboard.git
   cd TMUSync--D2L-University-Schedule-Integration-Dashboard
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Configure Environment**
   Create a `.env.local` file:
   ```env
   # Session encryption (32+ characters)
   SECRET_COOKIE_PASSWORD="your_complex_password_at_least_32_characters"

   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_project.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_project.appspot.com"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
   NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"

   # Firebase Admin (for server-side operations)
   FIREBASE_PROJECT_ID="your_project_id"
   FIREBASE_CLIENT_EMAIL="your_service_account_email"
   FIREBASE_PRIVATE_KEY="your_private_key"
   ```

4. **Launch the Dashboard**
   ```bash
   pnpm dev
   ```
   Visit `http://localhost:3000` to enter the cinematic experience.

---

## 🔧 Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **UI Components** | Shadcn UI + Radix Primitives |
| **Animation** | Framer Motion + CSS3 |
| **Authentication** | Firebase Auth |
| **Database** | Firebase Firestore |
| **State Management** | React Hooks + Context |
| **Visuals** | CSS Gradients, Backdrop Filters, SVG Noise |

---

## 📸 Screenshots

### Landing Page
The editorial-style homepage featuring bold typography, aurora gradients, and animated grain textures.

### Dashboard (Light Mode)
Unified command center with weekly schedule, upcoming assignments, quick actions, and completion tracking.

### Dashboard (Dark Mode)
Premium nighttime aesthetic with aurora gradients and high-contrast typography.

### Class Details Modal
Rich overlay showing course information, schedule times, location, and custom notes.

### Mobile Experience
Fully responsive design with touch-optimized Tarot stat cards and bottom navigation.

---

## 🗺️ Roadmap

- [ ] AI-powered assignment descriptions
- [ ] Pomodoro timer integration
- [ ] Grade tracker with GPA calculator
- [ ] Syllabus analyzer
- [ ] Calendar export (Google Calendar, Apple Calendar)
- [ ] Push notifications for upcoming deadlines

---

## 🤝 Contributing

Contributions are welcome! Areas where help is appreciated:

- **UI/UX**: Refining glassmorphism effects and motion physics
- **Features**: Implementing roadmap items
- **Testing**: Cross-browser and mobile testing
- **Documentation**: Improving setup guides

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

## 👨‍💻 Author

**Ahraz K.**  
Built with ☕ and late-night debugging sessions.

*TMUSync is not affiliated with Toronto Metropolitan University. This is an independent student project.*
