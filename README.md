# 🎨 NFC Card System — Frontend

A production-ready **React 18 + TypeScript + Tailwind CSS** single-page application for the Digital NFC Business Card platform.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | React 18 | Concurrent rendering, stable ecosystem |
| Language | TypeScript (strict) | Type safety, IDE autocompletion |
| Styling | Tailwind CSS v3 | Utility-first, purged in production |
| Bundler | Vite 5 | Fast HMR, optimized production builds |
| Routing | React Router v6 | Declarative, nested routes, lazy loading |
| HTTP Client | Axios | Interceptors, auto JSON, better errors |
| Charts | Recharts | React-native, composable chart components |
| State | React Context + useState | Simple auth state — no Redux needed |

---

## Folder Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   └── index.tsx       # Button, Input, Alert, StatCard, PageSpinner
│   │   └── ProtectedRoute.tsx  # Route guard for auth + role checking
│   ├── contexts/
│   │   └── AuthContext.tsx     # Global auth state (user, token, login, logout)
│   ├── features/
│   │   ├── auth/
│   │   │   └── AuthPages.tsx   # LoginPage + RegisterPage
│   │   ├── card/
│   │   │   └── CardPublicView.tsx  # Public digital card (NFC/QR destination)
│   │   ├── dashboard/
│   │   │   ├── UserDashboard.tsx   # Analytics, card management
│   │   │   └── ProfileEditPage.tsx # Edit digital card content + links
│   │   └── admin/
│   │       └── AdminDashboard.tsx  # Admin panel (stats, cards, users)
│   ├── services/
│   │   └── api.ts              # All Axios API calls, interceptors
│   ├── styles/
│   │   └── global.css          # Tailwind directives + custom component classes
│   ├── types/
│   │   └── index.ts            # Shared TypeScript interfaces
│   ├── App.tsx                 # Router + route definitions
│   └── index.tsx               # React entry point
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env if needed (defaults work for local development with Vite proxy)
```

### 3. Start Development Server
```bash
npm run dev
# Opens at http://localhost:3000
# API calls to /api/* are proxied to http://localhost:5000
```

### 4. Build for Production
```bash
npm run build
# Output goes to dist/ — serve with any static host
```

---

## Pages & Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Redirects to `/login` |
| `/login` | Public | Login form |
| `/register` | Public | Registration form (optionally activates card) |
| `/card/:cardId` | Public | **Digital card view** — shown when NFC/QR is scanned |
| `/dashboard` | Auth required | Scan analytics + card management |
| `/profile` | Auth required | Edit digital card content and links |
| `/admin` | Admin only | System stats, card creation, user management |

---

## Key Design Decisions

**Why Vite over CRA?**
Vite's native ESM dev server has instant HMR regardless of project size. CRA slows down significantly as a project grows.

**Why Context over Redux for auth?**
Auth state (user + token) changes rarely and is simple in shape. Context + localStorage is perfectly adequate. Redux adds ~20KB and significant boilerplate for no real gain here.

**Why Axios over fetch()?**
Axios interceptors let us inject the JWT automatically on every request and handle 401 responses globally — without repeating logic in every component.

**Why Recharts over Chart.js?**
Recharts is React-native (components, not canvas API). It composes naturally with JSX and TypeScript.

---

## NFC / QR Card Flow

When a physical card is tapped or scanned:
1. The browser opens `yourdomain.com/card/CARD_XXXXXX`
2. `CardPublicView` fetches the card profile from the API
3. The API records the scan event automatically (no user action)
4. If the card is **active** → full digital card is displayed
5. If the card is **unassigned** → activation prompt is shown
6. User can tap "Add to Contacts" to download a `.vcf` file

---

## Customization

**Brand Colors:** Edit `tailwind.config.js` → `theme.extend.colors.brand`

**Link Types:** Edit `LINK_TYPES` array in `ProfileEditPage.tsx`

**Card Background Gradient:** Edit the gradient classes in `CardPublicView.tsx`
