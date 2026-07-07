# JobFlow - Job Application Tracker Chrome Extension

JobFlow is a production-quality, local-first Chrome Extension that automatically tracks your LinkedIn job applications. 

It captures job metadata directly from LinkedIn web page DOMs, prompts you to select the resume used, stores everything locally in the browser's IndexedDB database, and notifies you via Chrome notifications to follow up after 6 days.

## Key Features
- **100% Offline & Local-First:** No database servers, no external auth, no cloud syncing, and no trackers. All data stays inside your browser database.
- **Smart DOM Scraping:** Detects job pages dynamically and parses details (Company, Role Title, Location, Work Mode, Employment Type, and Description) with robust selectors.
- **Shadow DOM Overlay:** Non-obtrusive prompt injected via Shadow DOM on LinkedIn details screens to easily confirm trackings without leaving the page.
- **Chrome Alarms & Alerts:** Schedules follow-up alerts for 6 days. If an application status remains "Applied", a system notification will pop up.
- **Responsive Management Panel:** Full dashboard statistics, daily application targets tracker, detailed history log search/sort table, resume profile organizer, and data portable exports (CSV & JSON backups).

---

## Folder Architecture
```
jobflow/
├── public/                 # Static extension assets
│   ├── manifest.json       # Manifest V3 setup
│   └── icons/              # Extension logos
├── src/
│   ├── background/         # Chrome Service Worker (alarms, messaging, notifications)
│   ├── content/            # DOM observer & content scraper script
│   ├── popup/              # React Popup/Dashboard bundle entries
│   ├── pages/              # Dashboard, History, Resumes, Settings views
│   ├── components/         # Reusable styling blocks
│   ├── db/                 # Dexie.js (IndexedDB) initialization
│   ├── repositories/       # CRUD logic for tables (Applications, Resumes, Settings)
│   ├── store/              # Zustand global state management
│   ├── styles/             # Global CSS and Tailwind directives
│   └── types/              # TypeScript types and interfaces
├── vite.config.ts          # Compiles React Popup bundle
├── vite.background.config.ts # Compiles Background service worker
├── vite.content.config.ts  # Compiles Content Script
├── tailwind.config.js      # Styling design tokens
├── postcss.config.js       # PostCSS compiler rules
├── tsconfig.json           # TypeScript configuration
└── package.json            # Scripts & project dependencies
```

---

## Installation & Setup

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **pnpm** (preferred package manager) or npm/yarn

### 1. Install Dependencies
In the root directory of the workspace, run:
```bash
pnpm install
```

### 2. Compile Output
Build the React UI, Background Worker, and Content Script:
```bash
pnpm run build
```
This runs:
- `vite build` (React application bundle to `dist/index.html` + assets)
- `vite build -c vite.background.config.ts` (Background worker compiled to `dist/background.js`)
- `vite build -c vite.content.config.ts` (Content script compiled to `dist/content.js`)

The complete bundled output will be placed in the `dist/` directory.

### 3. Load into Google Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle the **"Developer mode"** switch in the top-right corner.
3. Click the **"Load unpacked"** button in the top-left.
4. Select the output **`dist`** directory inside this project folder.
5. The extension is now active. Pin it to your Chrome toolbar for easy access.

---

## Technical Specifications

### 1. Database Model (IndexedDB via Dexie.js)
- **`applications`**:
  `++id, company, status, appliedDate, resumeId, &jobUrl`
  - Normalizes Job URLs to exclude tracking params (e.g. extracts `/jobs/view/{id}/`) to perform precise duplicate prevention.
- **`resumes`**:
  `++id, name, fileName, uploadedDate`
  - Stores resume filename metadata, keeping the actual file system clean. Relational deletion triggers updates to detach matching resume associations in `applications` without breaking logs.
- **`settings`**:
  `key, value` (e.g., daily target, notifications state, theme)

### 2. Messaging API
Communication between context layers is managed via message passing:
- `CHECK_DUPLICATE` (content script -> background -> database validation)
- `GET_RESUMES` (content script -> background -> resume retrieval)
- `SAVE_APPLICATION` (content script -> background -> write job + alarm hook)
- `GET_SETTINGS` (popup -> background -> settings sync)

### 3. Verification & Developer Testing
- To verify correct compiling, run `pnpm run build` and ensure the output files (`dist/manifest.json`, `dist/background.js`, `dist/content.js`, `dist/index.html`) exist.
- A **Developer test mode** is available inside `src/background/index.ts`. If the message `SAVE_APPLICATION` receives a `testAlarm: true` payload, the follow-up reminder alarm is set to fire in **12 seconds** instead of 6 days. This allows you to verify that notifications trigger and links open correctly.
