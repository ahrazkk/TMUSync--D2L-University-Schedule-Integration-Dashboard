# 🌌 TMUSync: Cinematic University Dashboard

**A futuristic, immersive hub for your academic life.**

TMUSync integrates your university schedule (VSB) and D2L assignments into a single, visually stunning dashboard. It replaces the fragmented, clinical feel of university portals with a "Cinematic" experience featuring northern lights, liquid magnetic interactions, and holographic interfaces.

![Dashboard Preview](https://via.placeholder.com/1200x600?text=TMUSync+Cinematic+Dashboard)

---

## ✨ The Cinematic Experience (v2.0)

This is not just a redesign; it's an overhaul of how you interact with your data. We've introduced a **"Living UI"** philosophy:

### 🌟 Aurora Borealis Background
- A dynamic, animated Northern Lights effect that shifts colors (Violet, Cyan, Deep Blue) passively.
- **Film Grain Overlay**: Adds texture and cinematic depth to the interface.
- **Customizable**: Adjust intensity and opacity in the new Settings page.

### 🧲 Magnetic Liquid Borders
- **Proximity Awareness**: Cards "sense" your mouse cursor. The borders glow and pull towards your pointer before you even touch them.
- **Interactive Flashlight**: Moving your mouse creates a "spotlight" effect that flows across neighboring cards, connecting the UI elements seamlessly.
- **Scope**: Applied to Weekly Schedule, Quick Actions, Stats Cards, and Assignment lists.

### 🔮 Holographic Shimmer
- Loading states are no longer boring grey blocks. They are **holographic projections** that shimmer with the Aurora's colors, keeping the immersion intact even while fetching data.

### 🃏 3D Stats Cards
- The header stats (Study Hours, Assignments) are interactive 3D cards. Hover over them to see the magnetic border; click/flip them to reveal detailed breakdowns on the back face.

---

## 🛠️ Core Capabilities

Beneath the beautiful exterior lies the powerful **TMUSync Engine**:

### 🔄 Automated Synchronization
- **Headless Browser (Playwright)**: Securely logs into your university portal (VSB) to scrape class times and locations.
- **D2L Integration**: Fetches assignments, quizzes, and deadlines directly from Brightspace calendars.
- **Smart Deduplication**: Intelligently merges duplicate assignments across different platforms.

### 📅 Weekly Calendar & Planning
- **Drag-and-Drop**: Organize your own custom "Study Blocks" or "Personal Tasks" alongside official classes.
- **Conflict Detection**: Automatically highlights if an assignment is due during a lecture.

### 🧠 Intelligent Features
- **AI-Ready Architecture**: Built to support AI-generated assignment descriptions (Typing effects optional).
- **Persistent Tracking**: Completion status behaves like a video game achievement—satisfying and permanent (stored locally + synced).

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- University Credentials (for VSB/D2L access)

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/ahrazkk/TMUSync--D2L-University-Schedule-Integration-Dashboard.git
    cd TMUSync--D2L-University-Schedule-Integration-Dashboard
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Configure Environment**
    Create a `.env.local` file:
    ```env
    # Encryption key for secure sessions (32+ chars)
    SECRET_COOKIE_PASSWORD="complex_password_at_least_32_characters_long"

    # Optional: Initial UI Defaults
    NEXT_PUBLIC_AURORA_DEFAULTS_INTENSITY=15
    NEXT_PUBLIC_NOISE_DEFAULTS_OPACITY=25
    ```

4.  **Launch the Dashboard**
    ```bash
    npm run dev
    ```
    Visit `http://localhost:3000` to enter the cinematic view.

---

## 🔧 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Framer Motion (Animations)
- **UI Library**: Shadcn UI + Radix Primitives
- **Automation**: Playwright (Headless Browsing)
- **State**: React Hooks + LocalStorage Persistence
- **Visuals**: CSS3 Radial Gradients, Masking, SVG Filters

---

## 🤝 Contributing

We welcome designers and developers!
- **Designers**: Help us refine the glassmorphism and motion physics.
- **Developers**: We need help adding more university scraper modules.

**License**: MIT
**Author**: Ahraz & The Antigravity Team
