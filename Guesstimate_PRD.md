# Guesstimate — Product Requirements Document
**Version:** 1.0  
**Author:** Soham (Product Owner)  
**Status:** Draft for AI Agent Consumption  
**Last Updated:** May 2026

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Tech Stack & Infrastructure](#2-tech-stack--infrastructure)
3. [Design System](#3-design-system)
4. [Information Architecture & Routing](#4-information-architecture--routing)
5. [Authentication Flows](#5-authentication-flows)
6. [Public Hero / Landing Page](#6-public-hero--landing-page)
7. [User-Facing Application](#7-user-facing-application)
8. [Admin Panel — Guesstimates Management](#8-admin-panel--guesstimates-management)
9. [Admin Panel — User Management](#9-admin-panel--user-management)
10. [Database Schema](#10-database-schema)
11. [Supabase Integration Guide](#11-supabase-integration-guide)
12. [Deployment on GitHub Pages](#12-deployment-on-github-pages)
13. [Missing Flows & Edge Cases Addressed](#13-missing-flows--edge-cases-addressed)
14. [Non-Functional Requirements](#14-non-functional-requirements)

---

## 1. Product Overview

**Guesstimate** is a personal web application for practising estimation and Fermi-calculation challenges. Users browse a curated library of guesstimate questions, work through them, mark their progress, and leave personal notes. An admin interface allows the owner (and trusted admins) to manage questions and user accounts.

### Goals
- Provide a clean, engaging interface for practising guesstimate problems.
- Track individual user progress by category and difficulty.
- Give admins full CRUD control over questions and users.
- Remain simple to deploy on GitHub Pages with Supabase as backend.

### Users
| Role | Description |
|------|-------------|
| **Guest** | Unauthenticated visitor; can see the hero/landing page only. |
| **User** | Logged-in practitioner; accesses the full question library and tracks progress. |
| **Admin** | Privileged account; accesses the admin panel at `/admin`. |

---

## 2. Tech Stack & Infrastructure

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend Framework | **React 18+** (Vite) | Fast HMR, easy GitHub Pages deploy |
| Styling | **Tailwind CSS v3** + **DaisyUI v4** | Utility-first + pre-built component layer |
| Routing | **React Router v6** | Hash-based routing for GitHub Pages compatibility |
| Backend / DB | **Supabase** | PostgreSQL + Auth + Realtime + Storage |
| Auth | Supabase Auth (email/password) | Row-Level Security (RLS) enforces access |
| Hosting | **GitHub Pages** | Static site; Supabase handles all dynamic data |
| State Management | **React Context + TanStack Query** | Server state via TanStack Query, UI state via Context |
| Icons | **Lucide React** | Consistent icon set |
| Notifications | **React Hot Toast** | Lightweight toast system |
| Offline / Sync Layer | **`src/lib/db.ts` hybrid adapter** | Supabase-first with LocalStorage fallback; sync queue for offline-first writes. See Section 15. |

### Why Hash-Based Routing?
GitHub Pages serves a static `index.html`. Hash routing (`/#/path`) ensures deep-links work without a server rewrite rule.

---

## 3. Design System

### 3.1 Brand Identity

The app's visual language is **"Analytical Clarity"** — think of a Bloomberg terminal crossed with a modern SaaS product. Clean, data-forward, and confident. The dot-grid texture on cards (visible in the provided screenshot) reinforces the "graph paper / estimation notebook" metaphor throughout.

### 3.2 Color Palette

```css
/* === CORE PALETTE === */
--color-bg-base:        #EEF0F5;   /* Light blue-grey — page background */
--color-bg-surface:     #FFFFFF;   /* Card / modal surface */
--color-bg-muted:       #F4F6FA;   /* Input backgrounds, subtle fills */

--color-primary:        #1A2E6C;   /* Deep navy — primary brand color */
--color-primary-hover:  #152459;   /* Darker navy on hover */
--color-primary-light:  #E8ECF8;   /* Tinted navy for selected states */

--color-accent:         #2C4EDB;   /* Vibrant blue — CTAs, active elements */
--color-accent-hover:   #2342C4;   /* Accent hover */

/* === SEMANTIC COLORS === */
--color-success:        #16A34A;   /* Solved / green states */
--color-success-light:  #DCFCE7;
--color-warning:        #D97706;   /* Retry / amber states */
--color-warning-light:  #FEF3C7;
--color-danger:         #DC2626;   /* Delete / destructive actions */
--color-danger-light:   #FEE2E2;
--color-new-badge:      #1A2E6C;   /* "NEW" badge matches primary */

/* === DIFFICULTY COLORS === */
--color-easy:           #16A34A;   /* Green */
--color-medium:         #D97706;   /* Amber */
--color-hard:           #DC2626;   /* Red */

/* === NEUTRAL SCALE === */
--color-text-primary:   #111827;
--color-text-secondary: #6B7280;
--color-text-muted:     #9CA3AF;
--color-border:         #E5E7EB;
--color-border-focus:   #2C4EDB;
```

### 3.3 Typography

```css
/* Import in index.css */
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');

--font-display:  'Syne', sans-serif;      /* Logo, hero headings, section titles */
--font-body:     'DM Sans', sans-serif;   /* All body text, labels, buttons */
```

**Type Scale:**

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-hero` | 56px / 3.5rem | 800 | Hero headline |
| `text-display` | 36px / 2.25rem | 700 | Section headings |
| `text-title` | 22px / 1.375rem | 700 | Card titles, modal headers |
| `text-body-lg` | 16px / 1rem | 400 | Primary body text |
| `text-body` | 14px / 0.875rem | 400 | Secondary body, table rows |
| `text-caption` | 12px / 0.75rem | 500 | Badges, labels, meta |

### 3.4 Spacing & Layout

- Base unit: `4px`
- Page max-width: `1280px`, centered with `px-6` padding
- Card border-radius: `12px` (`rounded-xl`)
- Modal border-radius: `16px` (`rounded-2xl`)
- Badge border-radius: `9999px` (`rounded-full`) for pills; `6px` for category badges

### 3.5 Card Category Colors & Dot-Grid Texture

Each question card's background color is determined by its **category**. This gives the grid immediate visual variety and lets users identify category clusters at a glance. The dot-grid pattern is applied on top of the category color in all cases — but its behavior changes based on the card's solved state (see Section 7.3 for full state logic).

#### Category Background Colors

| Category | Background Color | Hex | Dot Color |
|----------|-----------------|-----|-----------|
| Population | Warm terracotta tint | `#FDF0EB` | `#F5C4AD` |
| Market Sizing | Soft violet tint | `#F0EDFB` | `#C9BEEE` |
| Fermi Estimate | Muted teal tint | `#E8F5F3` | `#A8D5CF` |
| Scientific | Cool sky tint | `#EAF2FB` | `#AECFED` |
| *(any future category)* | Neutral grey tint | `#F4F6FA` | `#CBD5E1` |

These are intentionally desaturated pastels — vivid enough to differentiate categories, soft enough not to compete with the question text or badges.

#### CSS Implementation

Define one class per category, each composing the dot-grid pattern on top of its base color:

```css
/* Base dot-grid mixin — reused across all category variants */
/* background-color is overridden per category */

.card-population {
  background-color: #FDF0EB;
  background-image: radial-gradient(circle, #F5C4AD 1px, transparent 1px);
  background-size: 18px 18px;
}

.card-market-sizing {
  background-color: #F0EDFB;
  background-image: radial-gradient(circle, #C9BEEE 1px, transparent 1px);
  background-size: 18px 18px;
}

.card-fermi-estimate {
  background-color: #E8F5F3;
  background-image: radial-gradient(circle, #A8D5CF 1px, transparent 1px);
  background-size: 18px 18px;
}

.card-scientific {
  background-color: #EAF2FB;
  background-image: radial-gradient(circle, #AECFED 1px, transparent 1px);
  background-size: 18px 18px;
}

.card-default {
  background-color: #F4F6FA;
  background-image: radial-gradient(circle, #CBD5E1 1px, transparent 1px);
  background-size: 18px 18px;
}

/* Solved state — replaces the category color with a muted neutral dot-grid.
   Applied regardless of which category the card belongs to. */
.card-solved {
  background-color: #F0F2F5;
  background-image: radial-gradient(circle, #D1D5DB 1px, transparent 1px);
  background-size: 18px 18px;
  opacity: 0.85;
}
```

#### Applying the Class Dynamically (React)

The category class is resolved at render time from the question's `category` name. The solved override takes full precedence — a solved card always shows the muted grey dot-grid, regardless of category:

```javascript
const CATEGORY_CLASS_MAP = {
  'Population':      'card-population',
  'Market Sizing':   'card-market-sizing',
  'Fermi Estimate':  'card-fermi-estimate',
  'Scientific':      'card-scientific',
};

function getCardClass(categoryName, isSolved) {
  if (isSolved) return 'card-solved';
  return CATEGORY_CLASS_MAP[categoryName] ?? 'card-default';
}
```

The `retry` state does **not** change the card background color — it only affects the status badge. The card retains its full category color so the user can still visually identify it while it's queued for re-attempt.

### 3.6 Shadows

```css
--shadow-card:   0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.05);
--shadow-modal:  0 8px 40px rgba(0,0,0,0.14);
--shadow-button: 0 2px 6px rgba(44,78,219,0.25);
```

### 3.7 DaisyUI Theme Override

In `tailwind.config.js`, define a custom DaisyUI theme:

```javascript
daisyui: {
  themes: [
    {
      guesstimate: {
        "primary":          "#2C4EDB",
        "primary-content":  "#FFFFFF",
        "secondary":        "#1A2E6C",
        "accent":           "#16A34A",
        "neutral":          "#6B7280",
        "base-100":         "#EEF0F5",
        "base-200":         "#E5E8F0",
        "base-300":         "#D1D5DB",
        "base-content":     "#111827",
        "info":             "#2C4EDB",
        "success":          "#16A34A",
        "warning":          "#D97706",
        "error":            "#DC2626",
      },
    },
  ],
  darkTheme: false,
},
```

### 3.8 Responsive Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| `sm` | 640px | Single column |
| `md` | 768px | Two columns |
| `lg` | 1024px | Three columns (card grid) |
| `xl` | 1280px | Max layout width |

---

## 4. Information Architecture & Routing

```
/ (root)
├── /                          → PublicHeroPage (unauthenticated landing)
├── /login                     → UserLoginPage
├── /app                       → ProtectedLayout (requires User auth)
│   └── /app/dashboard         → UserDashboard (question grid + modals)
└── /admin                     → AdminLoginPage (separate login)
    └── /admin/dashboard        → AdminLayout (requires Admin auth)
        ├── /admin/dashboard/guesstimates   → GuesstimateMgmt (default tab)
        └── /admin/dashboard/users          → UserMgmt (tab switch)
```

**Routing rules:**
- `/` redirects logged-in Users to `/app/dashboard`
- `/` redirects logged-in Admins to `/admin/dashboard`
- `/app/*` routes redirect unauthenticated visitors to `/login`
- `/admin/dashboard/*` routes redirect non-admins to `/admin`
- Hash-based routing: all above paths are prefixed with `#` in the browser (`/#/app/dashboard`)

---

## 5. Authentication Flows

### 5.1 User Login Page (`/login`)

**Layout:** Centered card on the `--color-bg-base` background. The Guesstimate logo sits above the card.

**Components:**
- App logo / wordmark (top, centered)
- Heading: "Welcome back" (Syne, bold)
- Subheading: "Sign in to continue your practice" (DM Sans, muted)
- Email input field (with validation)
- Password input field (with show/hide toggle)
- "Sign in" primary button (full width)
- Error toast on invalid credentials
- Link: "Don't have an account? Contact the admin." (no self-registration — accounts are admin-created only)

**Behaviour:**
- On successful login: check user role from `profiles` table.
  - If `role = 'admin'` → redirect to `/admin/dashboard`
  - If `role = 'user'` → redirect to `/app/dashboard`
- Session is persisted via Supabase's built-in session management (localStorage).
- "Forgot password?" link — triggers Supabase's password reset email flow. Shows a confirmation message: "If this email is registered, a reset link has been sent."

### 5.2 Admin Login Page (`/admin`)

**Layout:** Identical card layout to user login, but with a distinct visual cue — a small "Admin Access" badge in the top-right of the card, rendered in `--color-primary`.

**Components:** Same as User Login above.

**Behaviour:**
- On successful login: check `role` from `profiles` table.
  - If `role = 'admin'` → redirect to `/admin/dashboard`
  - If `role = 'user'` → show error toast: "You do not have admin access." Do not redirect.
- Accessing `/admin` while already logged in as admin redirects directly to `/admin/dashboard`.

### 5.3 Logout

- A "Sign Out" option appears in the User's profile avatar dropdown (user-facing) and a top-right button in the admin panel.
- Calls `supabase.auth.signOut()` and redirects to the respective login page.

### 5.4 Session Persistence

- Supabase handles session tokens automatically.
- On app load, check `supabase.auth.getSession()` before rendering to avoid flash of wrong screen.
- Show a full-screen loading spinner while session is being verified.

---

## 6. Public Hero / Landing Page

**Route:** `/`  
**Access:** Public (no auth required)  
**Purpose:** Attract and orient new visitors; drive sign-in.

### 6.1 Layout Sections

#### Section A: Navigation Bar
- Left: Guesstimate wordmark (Syne, `--color-primary`)
- Right: "Sign In" button (outlined, accent color)
- Sticky, with a subtle backdrop-blur on scroll

#### Section B: Hero Section
- **Background:** Subtle animated dot-grid pattern, same as card texture but full-page, slowly animating (CSS keyframe, very subtle drift)
- **Headline (Syne, 800, 56px):** "Sharpen Your Estimation Thinking."
- **Subheadline (DM Sans, 400, 18px, muted):** "Practice Fermi problems, market sizing, and scientific guesstimates. Track your progress. Build the mental models that matter."
- **Primary CTA:** "Start Practising" button → `/login`
- **Secondary CTA:** "See How It Works" → smooth scroll to Section D
- **Visual:** A floating mock question card (styled exactly like the real cards in the app, showing a sample question like "Number of coffee shops in Manhattan?") — gives users an immediate feel for the product.

#### Section C: Stats Strip
A horizontal band with 3–4 animated counters (count-up animation on scroll-enter):
- "X+ Questions" (e.g., 50+)
- "4 Categories"
- "3 Difficulty Levels"
- "Personal Progress Tracking"

These are hardcoded marketing numbers, not live DB queries.

#### Section D: How It Works
Three-step horizontal layout (or vertical on mobile):
1. **Browse** — "Filter questions by category and difficulty"
2. **Estimate** — "Work through the problem using your own method"
3. **Track** — "Mark solved, add notes, and retry to improve"

Each step has a simple icon (Lucide), a step number, a title, and 1–2 sentences of description.

#### Section E: Category Showcase
4 category cards in a 2×2 grid (or horizontal scroll on mobile):
- Population
- Market Sizing
- Fermi Estimate
- Scientific

Each card shows the category name, a short one-liner description, and a Lucide icon.

#### Section F: CTA Footer Banner
Full-width band in `--color-primary` background:
- Headline: "Ready to think in numbers?"
- CTA button: "Get Started" → `/login`

#### Section G: Footer
Simple single-line footer:
- "© 2026 Guesstimate. Built for curious minds."
- No social links (personal app)

---

## 7. User-Facing Application

**Route:** `/app/dashboard`  
**Access:** Authenticated Users only  

### 7.1 Global Navigation Bar

| Element | Detail |
|---------|--------|
| Logo / Wordmark | Left-aligned "Guesstimate" in Syne font, `--color-primary` |
| Search Bar | Centered, wide, placeholder "Search challenges..." — live filters cards by question text |
| Notification Bell | Right of search — currently decorative (v1), icon only |
| User Avatar | Circular, right-aligned, shows user's initials (e.g. "JD") in `--color-primary` bg. Click → User Profile & Progress Modal |

### 7.2 Discovery & Filter Ribbon

A single horizontal row below the nav bar:

**Left side — Category filters:**
- "All" pill (default active, filled style)
- "Population", "Market Sizing", "Fermi Estimate", "Scientific" — checkbox-style multi-select pills
- Categories are dynamically fetched from the DB (admin can add new ones)
- Active category pill: filled `--color-primary` bg, white text
- Inactive: outlined border, `--color-text-secondary` text

**Right side — Additional filters:**
- "Difficulty: All" dropdown → options: All, Easy, Medium, Hard
- "Show Solved" toggle (default: ON) — hides/shows solved cards
- "Show Retries Only" toggle (default: OFF) — filters to retry-flagged cards only
- Both toggles are DaisyUI `toggle` components in `--color-primary`

### 7.3 Question Card Grid

**Layout:** Responsive grid
- Mobile: 1 column
- Tablet (md): 2 columns
- Desktop (lg+): 3 columns
- Gap: `gap-5`
- Infinite scroll: fetches next 12 cards when user scrolls near the bottom

**Card anatomy:**

```
┌─────────────────────────────────────────┐  ← category-colored dot-grid bg
│ [POPULATION]           [● SOLVED / NEW] │  ← top badges
│                                         │
│  Number of coffee shops                 │  ← bold question text
│  in Manhattan?                          │
│                                         │
│  👍 1.2k  👎          Medium    [▶]    │  ← bottom row
└─────────────────────────────────────────┘
```

- **Category Badge:** top-left, uppercase, small caps, pill with white/translucent background, `text-text-secondary`
- **Status Badge:**
  - SOLVED: `bg-accent` (blue), white text, checkmark icon
  - NEW: `bg-primary` (dark navy), white text
  - RETRY: amber/warning badge, retry icon
  - (No badge = unseen/default)
- **Question Text:** Syne, bold, 18–20px, dark, max 3 lines, truncated with ellipsis
- **Upvote Count:** Thumbs-up Lucide icon + count (e.g. "1.2k")
- **Downvote:** Thumbs-down icon (no count shown on card, only in workspace)
- **Difficulty Badge:** text only, colored per difficulty level, right-aligned
- **Play Button (CTA):** Circular, filled `--color-accent`, white arrow icon. On SOLVED cards: slightly muted circle (still clickable). Opens Question Workspace Modal.

**Card background & state rules:**

The card background is a two-layer system: **category color** as the base, with **solved state** as the only override.

| State | Background | Dot-Grid | Opacity | Notes |
|-------|-----------|----------|---------|-------|
| Default (unseen) | Full category color (e.g. `#FDF0EB` for Population) | Category dot color | 100% | Vivid, distinct per category |
| Retry | Full category color (unchanged) | Category dot color | 100% | Only the status badge changes; background stays vivid |
| Solved | Muted neutral grey `#F0F2F5` | Grey `#D1D5DB` | 85% | Category color is fully replaced — solved cards always look the same regardless of category |
| Hover (any state) | Unchanged | Unchanged | 100% | Lift shadow + `scale(1.01)` CSS transform |

**Why this approach:**
- Unsolved and retry cards keep their category color so the user can still scan by type while deciding what to attempt next.
- Solved cards are deliberately stripped of color and muted — they visually "recede" into the background, letting unfinished cards pop forward. The grid becomes a natural to-do list: colorful = needs attention, grey = done.

**CSS class resolution logic (repeat from Design System for agent convenience):**

```javascript
// isSolved: boolean derived from user_progress.status === 'solved' for this user+question
// categoryName: string from questions.category joined with categories.name

function getCardClass(categoryName, isSolved) {
  if (isSolved) return 'card-solved';
  const map = {
    'Population':      'card-population',
    'Market Sizing':   'card-market-sizing',
    'Fermi Estimate':  'card-fermi-estimate',
    'Scientific':      'card-scientific',
  };
  return map[categoryName] ?? 'card-default';
}
```

**Loading indicator (bottom of grid):**
Three animated dots + "LOADING MORE CHALLENGES..." in caption style, centered.

### 7.4 Modal: User Profile & Progress

**Trigger:** Click on user avatar (top-right nav)  
**Type:** Centered overlay modal, backdrop blur  
**Non-editable read-only dashboard**

**Sections:**

1. **Header:** "Your Progress" title + X close button
2. **Username display:** User's full name, email below in muted
3. **Overall Progress Card:** Large percentage (e.g. "64%"), subtitle "Questions Solved", circular progress ring or wide progress bar
4. **Macro Metrics Row:** Two side-by-side stat cards
   - Total Solved (count)
   - Total Retry (count)
5. **Category Breakout:** Vertical list of categories, each with:
   - Category name
   - Progress bar (DaisyUI `progress` component, `--color-accent`)
   - Percentage text (e.g. "72%")
6. **Difficulty Breakout:** Three rows: Easy / Medium / Hard with individual progress bars in their respective difficulty colors
7. **Footer Actions:**
   - "Reset My Statistics" button — destructive (red, outlined). Shows an inline confirmation: "Are you sure? This cannot be undone." with Confirm / Cancel.
   - "Close" button — neutral

### 7.5 Modal: Question Workspace & Engagement

**Trigger:** Click play button on any question card  
**Type:** Wide centered modal (max-width 860px), backdrop blur  
**Two-column layout (stacked on mobile)**

#### Left Column: Context & Metadata

1. **Question Text Panel:** Large read-only text box (rounded, bg-muted), full question string
2. **Metadata Row:**
   - Difficulty badge (colored: Easy/Medium/Hard)
   - Category badge
   - Tag pills (array of alphanumeric keyword capsules)
3. **Resource Links Stack:**
   - "Hint 1" — external link anchor (opens in new tab)
   - "Hint 2" — external link anchor (opens in new tab)
   - Shown only if URLs exist; hidden if empty

#### Right Column: Engagement, Notes & Analytics

1. **Platform Feedback Row:** Upvote (thumbs-up) + Downvote (thumbs-down) buttons, each showing their live global counter. User can toggle once; selecting one deselects the other.
2. **Global Analytics Grid:** 2-column mini stat cards:
   - Total Solved (global platform count)
   - Total Retry (global platform count)
3. **Personal Notes Textarea:** Multi-line input, placeholder "Write your working, assumptions, or calculations here...", min 5 rows
4. **Save Notes Button:** Small secondary button below textarea. Shows success toast on save.

#### Footer Control Deck (State Persistence)

Three buttons, always visible:
- **Mark Solved** (success green, left): Instantly flags question as Solved in DB. Button transitions to filled/active state when already solved. Modal stays open.
- **Mark Retry** (amber, center): Instantly flags as Retry. Same active-state behavior. Modal stays open.
- **Close** (neutral, right): Closes modal, returns to grid.

**Behaviour notes:**
- Solved and Retry are mutually exclusive states per user per question.
- Clicking "Mark Solved" on an already-Solved question → removes the solved flag (toggle behavior).
- Same for Retry.
- The card in the background grid updates its state badge immediately (optimistic update).

---

## 8. Admin Panel — Guesstimates Management

**Route:** `/admin/dashboard/guesstimates` (default admin view)  
**Access:** Admin role only  

### 8.1 Admin Nav Bar

- Left: "Hello, Admin!" greeting (Syne, bold)
- Right: Tab switcher — "Guesstimates" | "Users" (active tab: filled pill style)
- Far right: "Sign Out" text button

### 8.2 Quick Stats Ribbon

Four stat cards in a horizontal row (2×2 on mobile):

| Card | Metric | Detail |
|------|--------|--------|
| Total Questions | Integer count | All questions in DB |
| Categories | Integer count | Unique category count |
| Difficulty Split | "Easy X / Med Y / Hard Z" | Counts per tier |
| Publish Status | "Published / Draft" | Published is large; Draft + slash is small and muted |

Card style: white bg, rounded-xl, subtle shadow, Syne bold for the number.

### 8.3 Master Guesstimates Table

**Data Control Header Bar (above table):**
- Search input (live filter by question text)
- Category multi-select dropdown filter
- Difficulty multi-select dropdown filter
- Reset Filters icon button (Lucide `X` or `RotateCcw`)
- **Bulk Upload icon button** — Lucide `Upload` icon, outlined secondary style, positioned left of "+ Add New Question". On hover: DaisyUI tooltip renders — *"Bulk Upload Questions"*. Clicking opens the Bulk Upload Modal (see Section 8.7).
- "+ Add New Question" primary button (right-aligned, `--color-accent` bg)

**Header bar layout order (left → right):**
`[🔍 Search Input]` `[Category ▾]` `[Difficulty ▾]` `[↺ Reset]` — — — `[⬆ Bulk Upload]` `[+ Add New Question]`

**Table Columns:** Question | Category | Difficulty | Attempts | Status | Actions

| Column | Detail |
|--------|--------|
| Question | Truncated text (max 60 chars, title-case) |
| Category | Plain text |
| Difficulty | Colored badge (Easy/Medium/Hard) |
| Attempts | Integer — sum of (solved + retry) across all users |
| Status | "Published" (green badge) / "Draft" (amber badge) |
| Actions | Edit icon button \| Delete icon button \| Stats icon button |

**Footer Pagination:**
- "Showing X of Y entries" text (left)
- Pagination: ⏮ 1 2 3 … ⏭ (DaisyUI join component)
- Page size: 15 rows per page

### 8.4 Modal: Question Statistics (Read-Only)

**Trigger:** "Stats" icon button in table row  
**Layout:** Single-column overlay, max-width 600px

1. Header: "Question Statistics" + X close
2. Question text (large read-only panel)
3. Metadata row: Category badge + Difficulty badge
4. Tag pills row
5. Analytics 2×2 grid (colored cards):
   - Total Solved — green bg
   - Total Retry — amber bg
   - Upvotes — blue bg
   - Downvotes — red bg

### 8.5 Modal: Content Studio (Add / Edit Question)

**Trigger:** "+ Add New Question" button (empty state) or row Edit button (pre-populated)  
**Type:** Wide two-column modal (max-width 900px)

**Header:** "Add a Guesstimate" or "Edit a Guesstimate" + X close

#### Left Column: Content Input Form

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Main Question | Multi-line textarea | ✅ Yes | Min 10 chars |
| Category | Multi-select dropdown | ✅ Yes | Fetched from `categories` table |
| Difficulty | Segmented control (Easy/Med/Hard) | ✅ Yes | Single select |
| Tags | Token/chip input | Optional | Comma or Enter to add; X to remove each tag |
| Resource URL 1 | Text input | Optional | Validates as valid URL format |
| Resource URL 2 | Text input | Optional | Validates as valid URL format |

**+ Add New Category** button — opens the Add New Category child modal on top.

#### Right Column: Variable Control Panel

1. **Stats Registry** (read-only in add mode; live in edit mode):
   Each stat in a row: label + value + color accent strip
   - Total Solved
   - Total Retry
   - Upvotes
   - Downvotes
2. **Reset Stats** button — amber, outlined. Zeros out all 4 stats for this question. Shows inline confirm.
3. **Status Toggle:**
   - Two options: "Draft" | "Published"
   - Styled as a segmented pill selector
   - Default for new questions: Draft

**Footer Actions:**
- "Delete Question" — bottom-left, red outlined (only visible in Edit mode)
- "Cancel" — bottom-right, neutral
- "Save Changes" — bottom-right, primary filled

**Validation on Save:**
- Question field cannot be empty
- Category must be selected
- Difficulty must be selected
- URLs, if entered, must pass basic URL format validation
- Show field-level error messages below inputs

### 8.6 Modal: Add New Category

**Type:** Small child modal stacked above Content Studio  
**Max-width:** 400px

- Header: "Add New Category" + X
- Input: text field, placeholder "Enter new category name"
- Validation: min 2 chars, no duplicate check on frontend (Supabase unique constraint handles it)
- Footer: Cancel | Save

On Save: new category is added to `categories` table and immediately appears in the Category dropdown of the parent Content Studio modal.


---

### 8.7 Modal: Bulk Upload Questions

**Trigger:** Click the Bulk Upload icon button (Lucide `Upload`) in the Data Control Header Bar  
**Type:** Centered overlay modal, max-width 680px, backdrop blur  
**Access:** Admin only

---

#### 8.7.1 Overview & Purpose

Bulk Upload allows the admin to add multiple guesstimate questions to the database in a single operation using a structured Excel (`.xlsx`) or CSV (`.csv`) file. This is the primary workflow for seeding the question library at launch or adding large batches of new content.

---

#### 8.7.2 Accepted File Format

The upload file must follow a strict column schema. The admin downloads a pre-filled template from within the modal to avoid formatting errors.

**Sheet name (Excel only):** `Questions` — the parser reads only this sheet. Any other sheets in the workbook are ignored.

**Columns (in order):**

| Column Header | Required | Accepted Values | Notes |
|---------------|----------|-----------------|-------|
| `question` | ✅ Yes | Any text string | Min 10 characters. The full question prompt. |
| `category` | ✅ Yes | Must exactly match an existing category name in the DB | Case-insensitive match (e.g. `market sizing` = `Market Sizing`). If the category doesn't exist, the row is flagged as an error. |
| `difficulty` | ✅ Yes | `Easy`, `Medium`, or `Hard` | Case-insensitive. Any other value flags the row as an error. |
| `tags` | Optional | Comma-separated values | e.g. `india,urban,transport`. Spaces around commas are stripped. Leave blank if none. |
| `url_1` | Optional | Full URL string | Must start with `http://` or `https://` if provided. Leave blank if none. |
| `url_2` | Optional | Full URL string | Same as `url_1`. |
| `status` | Optional | `Draft` or `Published` | Case-insensitive. Defaults to `Draft` if left blank. |

**Example file (as it would look in Excel/CSV):**

```
question,category,difficulty,tags,url_1,url_2,status
Number of coffee shops in Mumbai?,Market Sizing,Medium,"india,urban,food","https://example.com/hint1",,Draft
Total mass of all insects on Earth?,Scientific,Hard,"biology,earth",,, Published
Number of red traffic lights in London?,Population,Easy,,,, 
How many piano tuners are in Chicago?,Fermi Estimate,Medium,"fermi,usa,music","https://example.com/hint","https://example.com/hint2",Published
```

**CSV rules:**
- UTF-8 encoding required
- Comma-delimited (`,`)
- First row must be the header row with exact column names as specified above
- Column order must match the table above exactly
- Values with commas inside (e.g. tags) must be wrapped in double-quotes
- Maximum 200 rows per upload file

**Excel rules:**
- `.xlsx` format only (no `.xls`, no `.xlsm`)
- First sheet must be named `Questions`
- Row 1 = header row; data starts from Row 2
- No merged cells, no formulas — plain text values only
- Maximum 200 rows of data (Row 2 to Row 201)

---

#### 8.7.3 Downloadable Template

A **"Download Template"** button is prominently shown inside the modal. It downloads a pre-built `.xlsx` file named `guesstimate_bulk_upload_template.xlsx` containing:
- The `Questions` sheet with the correct headers in Row 1, styled in `--color-primary` background with white text
- 3 pre-filled example rows (visually distinct in a light grey row color) that the admin can replace
- A second sheet named `Reference` (read-only instructions) listing:
  - Valid category names (pulled from current DB state at time of download)
  - Valid difficulty values
  - Status values and their behavior
  - Column-by-column instructions
  - Max row limit reminder

The template file is generated client-side using the `SheetJS (xlsx)` library. Valid categories are fetched from the `categories` table at download time so the Reference sheet is always current.

---

#### 8.7.4 Modal Layout & UI

**Header:** "Bulk Upload Questions" + X close button

**Body — Three sequential zones:**

**Zone 1: Instructions strip (always visible)**
A compact info banner (blue tint, `--color-primary-light` bg, info icon):
> "Upload an Excel (.xlsx) or CSV (.csv) file to add multiple questions at once. Max 200 rows per file. All questions are saved as Draft unless specified. Download the template to get started."

**Zone 2: Template Download + File Drop Area**

Left sub-section:
- "Download Template" button — secondary outlined, Lucide `FileDown` icon, left-aligned
- Small caption below: "Includes instructions and example rows"

Right sub-section (or below on mobile): File upload dropzone
- Dashed border, rounded-xl, `--color-bg-muted` fill
- Centered content:
  - Lucide `UploadCloud` icon (large, `--color-text-muted`)
  - Text: "Drag & drop your file here"
  - Sub-text: "or"
  - "Browse File" button — small secondary outlined
  - Caption: "Accepted: .xlsx, .csv · Max 200 rows · Max 5MB"
- On file selection (drag-drop or browse): dropzone transitions to a **File Preview Strip** showing:
  - File icon (Excel or CSV based on type)
  - File name
  - File size
  - Green checkmark if extension is valid
  - Red X icon if extension is invalid, with message: "Only .xlsx and .csv files are accepted."
  - "Remove" text link to clear and re-upload

**Zone 3: Validation Results Panel (visible only after parsing)**

Appears below the dropzone once a valid file is selected and parsed client-side. Shows a three-tab summary:

| Tab | Label | Condition |
|-----|-------|-----------|
| ✅ Ready | "X rows ready to upload" | Rows that passed all validation |
| ⚠️ Warnings | "X rows with warnings" | Optional fields missing — will use defaults |
| ❌ Errors | "X rows with errors" | Rows that will be skipped |

Default active tab: **Errors** if any exist, otherwise **Ready**.

**Ready tab** — shows a compact preview table (max 5 rows visible, scrollable):
| # | Question (truncated) | Category | Difficulty | Status |
|---|---------------------|----------|------------|--------|

**Warnings tab** — list of warnings, one per affected row:
- Row format: `Row [N]: [Column name] is blank — will default to [default value].`
- Example: `Row 4: status is blank — will default to Draft.`
- Example: `Row 7: tags is blank — no tags will be added.`

**Errors tab** — list of errors, one per affected row, in red:
- Row format: `Row [N]: [Error description]`
- Examples:
  - `Row 2: question is empty.`
  - `Row 5: category "Puzzles" does not match any existing category.`
  - `Row 8: difficulty "Extreme" is not valid. Must be Easy, Medium, or Hard.`
  - `Row 11: url_1 is not a valid URL.`
  - `Row 14: question is too short (minimum 10 characters).`
- Errored rows are **excluded from upload** — the admin must fix them in the file and re-upload.

**Overall summary line** (above the tabs, always visible after parsing):
> "Parsed 18 rows: **15 ready**, **2 warnings**, **1 error**. Errored rows will be skipped."

---

#### 8.7.5 Footer Actions

Three buttons, always in the footer:

| Button | Style | Behaviour |
|--------|-------|-----------|
| "Download Template" | Ghost / text link (left) | Downloads the template; kept accessible at all times |
| "Cancel" | Neutral outlined (right) | Closes modal, discards file selection |
| "Upload X Questions" | Primary filled (right) | Disabled until file is parsed and Ready count ≥ 1. Label shows the count of Ready rows (e.g. "Upload 15 Questions"). Disabled state shows "Upload Questions" in grey. |

---

#### 8.7.6 Upload Execution Flow

When the admin clicks "Upload X Questions":

1. **Button enters loading state** — label changes to "Uploading…", spinner replaces text, button is disabled. Modal cannot be closed during upload.
2. **Client sends rows to Supabase** — valid rows are batch-inserted into the `questions` table using Supabase's `insert()` with an array payload. Done in a single API call (or chunked in batches of 50 if count > 50).
3. **Category matching** — each row's `category` value is matched case-insensitively against the `categories` table. The resolved `category_id` UUID is inserted (not the text string).
4. **On success:**
   - Modal closes automatically
   - Success toast appears: **"✅ X questions uploaded successfully."**
   - The Guesstimates table refreshes to reflect new rows
   - Quick Stats ribbon counts update
5. **On partial failure (some rows rejected by DB):**
   - Modal stays open
   - Error banner appears inside modal: "Upload partially completed. X of Y questions were saved. The following rows failed:" followed by a list of failed question texts with DB error reasons.
   - Admin can download a **"Download Failed Rows"** CSV of only the failed entries for correction and re-upload.
6. **On total failure (network error / DB unreachable):**
   - Modal stays open
   - Error banner: "Upload failed. Please check your connection and try again."
   - "Upload X Questions" button re-enables so the admin can retry without re-selecting the file.

---

#### 8.7.7 Client-Side Parsing Logic

Parsing happens **immediately on file selection**, before the admin clicks Upload. This gives instant feedback without a round-trip to the server.

**Parser behaviour:**

```
1. Detect file type by extension (.xlsx or .csv)
2. Read file using SheetJS (xlsx library) for both types
3. Extract rows from sheet named "Questions" (xlsx) or from flat data (csv)
4. Skip the header row (Row 1)
5. For each data row:
   a. Trim all string values
   b. Run validation checks (see 8.7.4 Errors above)
   c. Classify as: ready | warning | error
6. Render Validation Results Panel (Zone 3)
```

**Validation check sequence per row:**

```
✅ Check 1: question is not blank
✅ Check 2: question length ≥ 10 characters
✅ Check 3: category is not blank
✅ Check 4: category matches an existing category (case-insensitive)
✅ Check 5: difficulty is not blank
✅ Check 6: difficulty is one of Easy / Medium / Hard (case-insensitive)
⚠️ Check 7: if url_1 is present, validate URL format
⚠️ Check 8: if url_2 is present, validate URL format
⚠️ Check 9: if status is blank → default to "Draft" (warning, not error)
⚠️ Check 10: if tags is blank → default to empty array (warning, not error)
```

Checks 1–6 failing = **error** (row excluded from upload).  
Checks 7–10 failing or blank = **warning** (row included with defaults applied).

**File-level rejections (before row-level parsing):**

| Condition | Message shown |
|-----------|--------------|
| File extension is not `.xlsx` or `.csv` | "Only .xlsx and .csv files are accepted. Please remove this file and upload a valid one." |
| File size exceeds 5MB | "File size exceeds the 5MB limit. Please reduce the file size and try again." |
| Excel file has no sheet named `Questions` | "Could not find a sheet named 'Questions' in this file. Please use the provided template." |
| File has 0 data rows (header only) | "The file appears to be empty. Please add at least one question row." |
| File has more than 200 data rows | "This file contains more than 200 rows. Please split it into multiple files of up to 200 rows each." |

---

#### 8.7.8 State Machine Summary

```
[Closed]
    │
    │ Admin clicks Bulk Upload button
    ▼
[Open — Idle]
  · No file selected
  · Upload button: disabled
    │
    │ Admin selects / drops file
    ▼
[Parsing]
  · Loading spinner in dropzone
  · "Analysing file…" caption
    │
    ├─→ [File-level error] → Show rejection banner in dropzone; no Zone 3
    │
    └─→ [Row-level results]
          │
          ├─→ Ready ≥ 1 → Upload button: enabled ("Upload X Questions")
          └─→ Ready = 0 → Upload button: disabled ("No valid rows to upload")
              │
              │ Admin clicks "Upload X Questions"
              ▼
          [Uploading]
            · Button: "Uploading…" + spinner
            · Modal non-dismissible
              │
              ├─→ [Full success]   → Close modal, success toast, table refresh
              ├─→ [Partial failure] → Stay open, partial error banner, download failed rows
              └─→ [Total failure]   → Stay open, error banner, re-enable button
```

---

#### 8.7.9 Duplicate Handling

The DB has no unique constraint on the `question` text field — intentionally, since two questions can be phrased similarly but be genuinely distinct. Therefore:

- **No duplicate detection is performed** during bulk upload.
- If the admin uploads the same file twice, duplicate question rows will be created.
- It is the admin's responsibility to ensure the file does not contain questions already in the library.
- A future enhancement (v2) could add an optional duplicate-check toggle in the modal that fuzzy-matches question text against existing DB records before inserting.

---

#### 8.7.10 Accessibility & UX Details

- The dropzone is keyboard-accessible: `Tab` to focus, `Enter` or `Space` to open the file browser.
- The "Browse File" button has `aria-label="Browse for file to upload"`.
- The Bulk Upload icon button in the header bar has `aria-label="Bulk Upload Questions"` and a DaisyUI `tooltip` attribute.
- Error and warning lists use `role="list"` and `role="listitem"` for screen reader compatibility.
- During upload, the modal has `aria-busy="true"` and `aria-label="Uploading questions, please wait"`.


### 8.8 Modal: Delete Confirmation

**Trigger:** Delete icon in table row, or "Delete Question" in Content Studio  
**Type:** Small focused overlay (max-width 480px), above all other modals

- Header: "Confirm Delete" + X
- Body: "Are you sure you want to delete this question? All statistics and user progress tied to this question will be permanently deleted. This cannot be undone."
- Footer: "Delete" (red filled) | "Cancel" (neutral)

---

## 9. Admin Panel — User Management

**Route:** `/admin/dashboard/users`  
**Access:** Admin role only  
**Switch:** Via the "Users" tab in admin nav

### 9.1 Quick Stats Ribbon

Four stat cards:

| Card | Metric |
|------|--------|
| Total Users | Count of all user profiles |
| Success Rate | (Total Solved across all users) ÷ (Total Published Questions × Total Users) × 100 |
| Questions Solved | Sum of all solved entries across all users |
| Questions Retried | Sum of all retry entries across all users |

### 9.2 Analytics Leaderboard Grid

Two-column grid below the stats ribbon:

**Component A: Top 5 Questions by Solve Count**
| Column | Detail |
|--------|--------|
| Question | Truncated text |
| Solved | Integer, sortable (default: descending) |
| Retries | Integer, sortable |

**Component B: Top 5 Users by Solve Count**
| Column | Detail |
|--------|--------|
| User | Full name |
| Solved | Integer, sortable (default: descending) |
| Retries | Integer, sortable |

### 9.3 Comprehensive Users Management Table

**Data Control Header Bar:**
- Search input — live filter by Name or Email
- "Sort By" dropdown — Newest (default) / Oldest
- "+ Add New User" button — primary, right-aligned

**Table Columns:** Name | Email | Easy | Medium | Hard | Solved | Retries | Actions

| Column | Detail |
|--------|--------|
| Name | Full name (First + Last) |
| Email | User email address |
| Easy | Horizontal progress bar, % completion of Easy questions |
| Medium | Horizontal progress bar, % completion of Medium questions |
| Hard | Horizontal progress bar, % completion of Hard questions |
| Solved | Total solved count |
| Retries | Total retry count |
| Actions | Edit icon \| Delete icon \| View Stats icon |

Progress bars: DaisyUI `progress` component, colored by difficulty (green/amber/red).

**Footer Pagination:** Same as Guesstimates table (15 per page, ⏮ numbered ⏭)

### 9.4 Modal: View Stats

**Trigger:** "View Stats" icon in table row  

- Header: "[First Name] [Last Name]'s Statistics" (font scales down for long names) + X
- Profile metadata: "Profile Created: [DD Month, YYYY]"
- Category Performance Grid (dynamic, max 6 categories): percentage chip/card per category, color-coded
- Macro Metrics: side-by-side panels
  - SOLVED (green)
  - RETRY (amber)

### 9.5 Modal: User Studio (Add / Edit User)

**Trigger:** "+ Add New User" (empty) or row Edit (pre-populated)  
**Type:** Wide two-column modal (max-width 860px)

**Header:** "Add a User" / "Edit a User" + X

#### Left Column: Account Credentials

| Field | Type | Notes |
|-------|------|-------|
| First Name | Text input | Required |
| Last Name | Text input | Required |
| Email Address | Email input | Required, unique |
| Password | Text input | **Plain text visible** (per spec); shown only in Add mode; in Edit mode, a "Reset Password" link sends a Supabase reset email instead |

**Note on Password security:** For a personal app shared with friends, this spec matches what was requested. For any broader deployment, consider switching to Supabase's invite-by-email flow.

#### Right Column: Live Statistics (read-only in Add mode)

- Profile Created date
- Category Performance: 5–6 colored percentage cards (hidden / zeroed in Add mode)
- SOLVED and RETRY numeric panels
- "Reset Stats" button — zeros out all stats for this user (amber, outlined, shows inline confirm)

**Footer Actions:**
- "Delete User" — bottom-left, red outlined (Edit mode only)
- "Cancel" — bottom-right, neutral
- "Save Changes" — bottom-right, primary filled

**On Save (Add mode):**
1. Create user in Supabase Auth via `supabase.auth.admin.createUser()`
2. Insert profile row in `profiles` table with `role = 'user'`
3. Show success toast; close modal; refresh table

**On Save (Edit mode):**
1. Update profile fields in `profiles` table
2. Show success toast; close modal; refresh table

### 9.6 Modal: Delete User Confirmation

- Header: "Confirm Delete User" + X
- Body: "Are you sure you want to delete this user profile? All statistics and information will be permanently deleted. There is no going back."
- Footer: "Delete User" (red filled) | "Cancel" (neutral)

On confirm: calls Supabase Admin API to delete auth user → cascade deletes profile and all progress rows via DB foreign key constraints.

---

## 10. Database Schema

All tables live in the Supabase `public` schema with Row Level Security (RLS) enabled. Supabase also maintains a built-in `auth.users` table (managed internally) that anchors all identity records.

---

### 10.0 Entity Relationship Overview

```
auth.users (Supabase managed)
    │
    │ 1 : 1  (profiles.id is both PK and FK → auth.users.id)
    ▼
┌─────────────┐        ┌──────────────┐
│  profiles   │        │  categories  │
│  ─────────  │        │  ──────────  │
│  PK: id     │        │  PK: id      │
└──────┬──────┘        └──────┬───────┘
       │                      │
       │ 1 : many             │ 1 : many
       │                      │
       ▼                      ▼
┌─────────────────────────────────────┐
│             questions               │
│  ───────────────────────────────    │
│  PK: id                             │
│  FK: category_id → categories.id   │
└──────────────────┬──────────────────┘
                   │
        ┌──────────┴──────────┐
        │ 1 : many            │ 1 : many
        ▼                     ▼
┌──────────────────┐  ┌───────────────┐
│  user_progress   │  │  user_votes   │
│  ─────────────   │  │  ──────────   │
│  PK: id          │  │  PK: id       │
│  FK: user_id     │  │  FK: user_id  │
│  FK: question_id │  │  FK: q_id     │
│  UQ: (user_id,   │  │  UQ: (user_id,│
│       question_id│  │       q_id)   │
└──────────────────┘  └───────────────┘
```

**Cardinality summary:**

| Relationship | Type | Notes |
|---|---|---|
| `auth.users` → `profiles` | 1 : 1 | One auth identity = one profile row |
| `categories` → `questions` | 1 : Many | One category can have many questions |
| `profiles` → `user_progress` | 1 : Many | One user can have progress on many questions |
| `questions` → `user_progress` | 1 : Many | One question can have progress records for many users |
| `profiles` → `user_votes` | 1 : Many | One user can vote on many questions |
| `questions` → `user_votes` | 1 : Many | One question can receive votes from many users |

---

### 10.1 Table: `categories`

Stores the classification buckets for questions. Admins can add new categories via the admin panel.

```sql
CREATE TABLE categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Column reference:**

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| `id` | UUID | **PK** — auto-generated | Unique identifier for each category |
| `name` | TEXT | NOT NULL, UNIQUE | Display name (e.g. "Market Sizing"). Unique constraint prevents duplicates at DB level. |
| `created_at` | TIMESTAMPTZ | NOT NULL, default NOW() | Timestamp of category creation |

**Key notes:**
- `id` is the **Primary Key**. Referenced as a **Foreign Key** by `questions.category_id`.
- The `UNIQUE` constraint on `name` acts as a natural key — no two categories can share the same label.
- `ON DELETE RESTRICT` is set on the FK in `questions` — you cannot delete a category that still has questions assigned to it. Admin must reassign or delete those questions first.

**Seeded values (run on first setup):**
```sql
INSERT INTO categories (name) VALUES
  ('Population'),
  ('Market Sizing'),
  ('Fermi Estimate'),
  ('Scientific');
```

---

### 10.2 Table: `questions`

The core content table. Every guesstimate challenge lives here.

```sql
CREATE TABLE questions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  question     TEXT        NOT NULL,
  category_id  UUID        NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  difficulty   TEXT        NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  tags         TEXT[]      DEFAULT '{}',
  url_1        TEXT,
  url_2        TEXT,
  status       TEXT        NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published')),
  upvotes      INTEGER     NOT NULL DEFAULT 0,
  downvotes    INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Column reference:**

| Column | Type | Constraint | Key | Description |
|--------|------|-----------|-----|-------------|
| `id` | UUID | NOT NULL, auto-generated | **PK** | Unique identifier for each question |
| `question` | TEXT | NOT NULL | — | The full guesstimate prompt string |
| `category_id` | UUID | NOT NULL | **FK → categories.id** | Links to the question's classification bucket |
| `difficulty` | TEXT | NOT NULL, CHECK | — | Enum-like: `'Easy'`, `'Medium'`, or `'Hard'` only |
| `tags` | TEXT[] | default `'{}'` | — | PostgreSQL array of keyword strings (e.g. `{'india', 'urban'}`) |
| `url_1` | TEXT | nullable | — | Optional hint/reference URL |
| `url_2` | TEXT | nullable | — | Optional second hint/reference URL |
| `status` | TEXT | NOT NULL, CHECK, default `'Draft'` | — | Enum-like: `'Draft'` (hidden from users) or `'Published'` (visible to users) |
| `upvotes` | INTEGER | NOT NULL, default 0 | — | Global running count of upvotes. Incremented/decremented via `user_votes` logic. |
| `downvotes` | INTEGER | NOT NULL, default 0 | — | Global running count of downvotes. |
| `created_at` | TIMESTAMPTZ | NOT NULL, default NOW() | — | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default NOW() | — | Last modification timestamp. Updated via trigger (see Section 11.6). |

**Key notes:**
- `id` is the **Primary Key**. Referenced as a **Foreign Key** by both `user_progress.question_id` and `user_votes.question_id`.
- `category_id` is a **Foreign Key** referencing `categories.id`. `ON DELETE RESTRICT` — prevents orphaned questions if a category is accidentally deleted.
- `upvotes` and `downvotes` are denormalized counts stored directly on the question for fast reads. They are kept in sync by the application layer whenever a row is inserted/updated/deleted in `user_votes`.
- `tags` uses a native PostgreSQL array column — no separate join table needed at this scale.

**Recommended index:**
```sql
CREATE INDEX idx_questions_category_id ON questions(category_id);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
```

---

### 10.3 Table: `profiles`

Extends Supabase's built-in `auth.users` table with application-level user data. One row per authenticated user.

```sql
CREATE TABLE profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name  TEXT        NOT NULL,
  last_name   TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  role        TEXT        NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Column reference:**

| Column | Type | Constraint | Key | Description |
|--------|------|-----------|-----|-------------|
| `id` | UUID | NOT NULL | **PK** and **FK → auth.users.id** | Shares the same UUID as the Supabase Auth user. Dual role: Primary Key of this table AND Foreign Key to the auth system. |
| `first_name` | TEXT | NOT NULL | — | User's first name |
| `last_name` | TEXT | NOT NULL | — | User's last name |
| `email` | TEXT | NOT NULL, UNIQUE | — | User's email. Mirrors `auth.users.email` for easy querying without joining to the auth schema. |
| `role` | TEXT | NOT NULL, CHECK, default `'user'` | — | Access level: `'user'` or `'admin'`. Determines which routes and RLS policies apply. |
| `created_at` | TIMESTAMPTZ | NOT NULL, default NOW() | — | Profile creation timestamp |

**Key notes:**
- `id` is simultaneously the **Primary Key** of `profiles` AND a **Foreign Key** to `auth.users.id`. This is a 1:1 extension pattern — every auth user gets exactly one profile row, auto-created via a DB trigger.
- `ON DELETE CASCADE` means if the auth user is deleted (e.g. via Supabase Admin API), the profile row is automatically deleted too, which in turn cascades to `user_progress` and `user_votes`.
- `id` is referenced as a **Foreign Key** by `user_progress.user_id` and `user_votes.user_id`.
- The `role` column is the single source of truth for authorization. Always read role from `profiles`, not from Supabase JWT claims, to keep admin promotion/demotion instant.

---

### 10.4 Table: `user_progress`

Tracks each user's interaction state with each question. One row per (user, question) pair — enforced by a composite unique constraint.

```sql
CREATE TABLE user_progress (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id  UUID        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  status       TEXT        NOT NULL CHECK (status IN ('solved', 'retry', 'none')),
  notes        TEXT        DEFAULT '',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, question_id)
);
```

**Column reference:**

| Column | Type | Constraint | Key | Description |
|--------|------|-----------|-----|-------------|
| `id` | UUID | NOT NULL, auto-generated | **PK** | Unique row identifier |
| `user_id` | UUID | NOT NULL | **FK → profiles.id** | The user this progress record belongs to |
| `question_id` | UUID | NOT NULL | **FK → questions.id** | The question this progress record refers to |
| `status` | TEXT | NOT NULL, CHECK | — | Enum-like: `'solved'`, `'retry'`, or `'none'`. Solved and retry are mutually exclusive — updating one resets the other in application logic. |
| `notes` | TEXT | default `''` | — | User's private working notes for this question |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default NOW() | — | Last time this record was modified |
| *(composite)* | — | UNIQUE (user_id, question_id) | **Composite UQ** | Enforces that a user can only have one progress row per question. Use `UPSERT` (INSERT … ON CONFLICT DO UPDATE) when writing progress. |

**Key notes:**
- `user_id` + `question_id` form a **Composite Unique Key** (not a composite PK — a separate surrogate PK `id` is used for simplicity). This means: no duplicate rows per user-question pair.
- Both FKs use `ON DELETE CASCADE`: deleting a user deletes all their progress rows; deleting a question deletes all progress rows for that question.
- When the frontend marks a question Solved, it should `UPSERT` with `status = 'solved'`, overwriting any prior `'retry'` state (and vice versa).

**Recommended index:**
```sql
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_question_id ON user_progress(question_id);
```

---

### 10.5 Table: `user_votes`

Records each user's upvote or downvote on a question. One vote per (user, question) pair — enforced by a composite unique constraint. The aggregate counts are also mirrored on `questions.upvotes` / `questions.downvotes` for fast reads.

```sql
CREATE TABLE user_votes (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id  UUID        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  vote         TEXT        NOT NULL CHECK (vote IN ('up', 'down')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, question_id)
);
```

**Column reference:**

| Column | Type | Constraint | Key | Description |
|--------|------|-----------|-----|-------------|
| `id` | UUID | NOT NULL, auto-generated | **PK** | Unique row identifier |
| `user_id` | UUID | NOT NULL | **FK → profiles.id** | The user who cast this vote |
| `question_id` | UUID | NOT NULL | **FK → questions.id** | The question being voted on |
| `vote` | TEXT | NOT NULL, CHECK | — | Enum-like: `'up'` or `'down'` only |
| `created_at` | TIMESTAMPTZ | NOT NULL, default NOW() | — | Timestamp of the vote |
| *(composite)* | — | UNIQUE (user_id, question_id) | **Composite UQ** | A user can only hold one vote per question at a time. Toggling direction = UPDATE the existing row. Removing a vote = DELETE the row. |

**Key notes:**
- Votes are mutually exclusive per user per question. There is no "both up and down" state.
- Vote toggle logic (application layer): if a user clicks upvote and already has an `'up'` row → DELETE the row (removes vote). If they have a `'down'` row → UPDATE to `'up'`. If no row exists → INSERT `'up'`.
- After any insert/update/delete on `user_votes`, the application must also update `questions.upvotes` and `questions.downvotes` to stay in sync. This can be done via a Supabase Database Trigger or in application logic.
- Both FKs use `ON DELETE CASCADE` for the same reasons as `user_progress`.

**Recommended index:**
```sql
CREATE INDEX idx_user_votes_user_id ON user_votes(user_id);
CREATE INDEX idx_user_votes_question_id ON user_votes(question_id);
```

---

### 10.6 Complete Key Reference Summary

A single reference table of all primary and foreign keys across the schema:

| Table | Column | Key Type | References | On Delete |
|-------|--------|----------|------------|-----------|
| `categories` | `id` | **Primary Key** | — | — |
| `questions` | `id` | **Primary Key** | — | — |
| `questions` | `category_id` | **Foreign Key** | `categories.id` | RESTRICT |
| `profiles` | `id` | **Primary Key** + **Foreign Key** | `auth.users.id` | CASCADE |
| `user_progress` | `id` | **Primary Key** | — | — |
| `user_progress` | `user_id` | **Foreign Key** | `profiles.id` | CASCADE |
| `user_progress` | `question_id` | **Foreign Key** | `questions.id` | CASCADE |
| `user_progress` | `(user_id, question_id)` | **Composite Unique** | — | — |
| `user_votes` | `id` | **Primary Key** | — | — |
| `user_votes` | `user_id` | **Foreign Key** | `profiles.id` | CASCADE |
| `user_votes` | `question_id` | **Foreign Key** | `questions.id` | CASCADE |
| `user_votes` | `(user_id, question_id)` | **Composite Unique** | — | — |

**Unique constraints (non-PK):**

| Table | Column(s) | Purpose |
|-------|-----------|---------|
| `categories` | `name` | No duplicate category names |
| `profiles` | `email` | No two users share an email |
| `user_progress` | `(user_id, question_id)` | One progress row per user per question |
| `user_votes` | `(user_id, question_id)` | One vote per user per question |

---

### 10.7 Deletion Cascade Behaviour

This table describes what happens at the DB level when a record is deleted, without any application code running:

| Deleted Record | Cascades To | Behaviour |
|---|---|---|
| `auth.users` row | `profiles` row | Auto-deleted (CASCADE) |
| `profiles` row | `user_progress` rows for that user | Auto-deleted (CASCADE) |
| `profiles` row | `user_votes` rows for that user | Auto-deleted (CASCADE) |
| `questions` row | `user_progress` rows for that question | Auto-deleted (CASCADE) |
| `questions` row | `user_votes` rows for that question | Auto-deleted (CASCADE) |
| `categories` row | `questions` with that category | **Blocked** (RESTRICT) — must reassign or delete questions first |

---

### 10.8 Row Level Security (RLS) Policies

```sql
-- =============================================
-- PROFILES
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read only their own profile row
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all profile rows
CREATE POLICY "Admins read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can insert, update, and delete any profile row
CREATE POLICY "Admins full access on profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- CATEGORIES
-- =============================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read categories (needed for filter dropdowns)
CREATE POLICY "Auth users read categories"
  ON categories FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can create, update, or delete categories
CREATE POLICY "Admins full access on categories"
  ON categories FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- QUESTIONS
-- =============================================
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can only read Published questions
CREATE POLICY "Auth users read published questions"
  ON questions FOR SELECT
  USING (auth.role() = 'authenticated' AND status = 'Published');

-- Admins have full access including Draft questions
CREATE POLICY "Admins full access on questions"
  ON questions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- USER_PROGRESS
-- =============================================
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Users can read, insert, update, and delete only their own progress rows
CREATE POLICY "Users manage own progress"
  ON user_progress FOR ALL
  USING (auth.uid() = user_id);

-- Admins can read all progress rows (for stats and leaderboards)
CREATE POLICY "Admins read all progress"
  ON user_progress FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- USER_VOTES
-- =============================================
ALTER TABLE user_votes ENABLE ROW LEVEL SECURITY;

-- Users can manage only their own vote rows
CREATE POLICY "Users manage own votes"
  ON user_votes FOR ALL
  USING (auth.uid() = user_id);

-- Admins can read all votes (for aggregate stats)
CREATE POLICY "Admins read all votes"
  ON user_votes FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

---

## 11. Supabase Integration Guide

### 11.1 Project Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Note your **Project URL** and **anon public key** from Settings → API
3. Run all SQL from Section 10 in the Supabase SQL Editor
4. Seed initial categories: Population, Market Sizing, Fermi Estimate, Scientific

### 11.2 Environment Variables

Create `.env.local` (never commit this file):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

For GitHub Pages deployment, add these as **Repository Secrets** and use a GitHub Actions build step.

### 11.3 Supabase Client Setup

```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### 11.4 Admin Operations

Admin user management (create/delete auth users) requires the **Service Role key**, which must **never** be exposed in the frontend. Options:
- **Option A (Recommended for personal use):** Use Supabase Dashboard directly to create/delete auth users. The admin panel's "Add User" and "Delete User" flows call a **Supabase Edge Function** that uses the service key server-side.
- **Option B (Simpler):** Disable auth user deletion from the UI; do it manually in Supabase Dashboard.

**Edge Function skeleton** (`supabase/functions/admin-user/index.ts`):
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const { action, userData } = await req.json()
  // handle 'create' and 'delete' actions
})
```

### 11.5 Creating the First Admin User

1. Create user via Supabase Dashboard → Authentication → Add User
2. In SQL Editor, run:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
   ```
   (Profile row is auto-created via a DB trigger on `auth.users` insert — see trigger below)

### 11.6 Auto-Create Profile Trigger

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 12. Deployment on GitHub Pages

### 12.1 Vite Config for GitHub Pages

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/your-repo-name/',  // Replace with your GitHub repo name
})
```

### 12.2 React Router — Hash Router

Use `HashRouter` instead of `BrowserRouter` to avoid 404s on page refresh:

```javascript
// src/main.jsx
import { HashRouter } from 'react-router-dom'
// Wrap <App /> with <HashRouter>
```

### 12.3 GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 12.4 Repository Secrets

In GitHub repo → Settings → Secrets → Actions:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 13. Missing Flows & Edge Cases Addressed

The following flows were identified as absent from the original screen specs and have been filled in:

| Gap | Resolution |
|-----|-----------|
| No login pages specified | Two separate login pages: `/login` (users) and `/admin` (admins) with role-based redirect |
| No public landing/hero page | Full hero page at `/` with branding, CTAs, and feature highlights |
| No self-registration flow | Intentionally omitted — admin creates all users. Login page states this explicitly. |
| No password reset | Supabase magic-link reset triggered from login page |
| No session persistence logic | Supabase handles via localStorage; app checks session on load with loading state |
| No logout flow | Logout in user avatar dropdown (user app) and admin nav bar (admin panel) |
| No route protection | `ProtectedRoute` wrapper component checks auth state and role before rendering |
| No first-admin setup | Documented SQL script to promote first user to admin role |
| No vote toggle behavior | Votes are mutually exclusive and togglable (second click removes vote) |
| Solved/Retry mutual exclusivity | Selecting Solved removes Retry flag and vice versa; second click removes current flag |
| Admin creating auth users securely | Edge Function pattern documented; service key never exposed client-side |
| No infinite scroll pagination | Fetch-on-scroll with 12-question batch size; TanStack Query `useInfiniteQuery` |
| No empty state for card grid | Empty state illustration + message: "No challenges match your filters. Try resetting them." |
| No 404 page | Simple 404 component with link back to home |
| No loading states | Skeleton loaders for cards; spinner for modals |
| URL validation for resource links | Basic URL format validation on save in Content Studio |
| Categories deletable causing orphans | `ON DELETE RESTRICT` on `questions.category_id` prevents deletion of in-use categories |

---

## 14. Non-Functional Requirements

### Performance
- Lighthouse score target: 90+ (Performance, Accessibility, Best Practices)
- Initial page load: under 2s on 4G
- Question cards: virtualization considered if question library exceeds 200 items

### Responsiveness
- All screens fully functional on mobile (375px+), tablet (768px+), and desktop (1280px+)
- Admin panel degrades gracefully on tablet (tables scroll horizontally); mobile access is discouraged but functional

### Accessibility
- All interactive elements keyboard-navigable
- ARIA labels on icon-only buttons
- Color is never the sole differentiator (badges always include text)
- Minimum contrast ratio: 4.5:1 for body text

### Security
- RLS enabled on all tables
- No service role key in frontend code
- Input sanitization on all form fields
- Supabase Auth handles password hashing

### Data Integrity
- Supabase DB constraints enforce: difficulty values, status values, vote direction values
- `UNIQUE (user_id, question_id)` on `user_progress` and `user_votes`
- `ON DELETE CASCADE` propagates user/question deletion to dependent rows

### Error Handling
- All API calls wrapped in try/catch
- User-facing errors shown via React Hot Toast
- Network errors show a generic "Something went wrong. Please try again." message
- Form validation errors shown inline below fields
- For Solved / Retry state mutations specifically, optimistic UI with silent rollback applies — see Section 15 for the full specification.

---

## 15. Offline Resilience, Hybrid Data Layer & Optimistic UI

### 15.1 Overview

The application's data layer (`src/lib/db.ts`) operates in a **hybrid mode**: it attempts all reads and writes against Supabase first, and falls back to LocalStorage when Supabase is unreachable. While this provides basic continuity, two structural gaps exist that this section addresses:

| Gap | Problem | Solution Specified Here |
|-----|---------|------------------------|
| Transient network drops | Failed Supabase calls produce error toasts or blank slates with no local buffering | LocalStorage read-through cache for question data |
| Offline-first → sign-in later | User marks questions Solved/Retry while offline; changes are lost when they reconnect | Persistent sync queue that drains on reconnection |
| Optimistic UI missing | UI waits for network confirmation before showing Solved/Retry state change | Immediate client-side state update with silent rollback on failure |

---

### 15.2 Hybrid Data Layer Architecture

The `src/lib/db.ts` module is the **single point of contact** for all data operations in the app. No component should call `supabase.*` directly — all queries go through `db.ts`. This is already the pattern; this section hardens it.

#### 15.2.1 Connection State Detection

```
db.ts maintains a module-level boolean: isOnline

Initialised by: navigator.onLine
Kept in sync by:
  window.addEventListener('online',  () => { isOnline = true;  drainSyncQueue(); })
  window.addEventListener('offline', () => { isOnline = false; })

Additionally: each Supabase call that throws a network-class error
sets isOnline = false and schedules a reconnection probe every 30s.
```

A small **connection status indicator** is shown to the user:
- When `isOnline = false`: a slim amber banner below the nav bar — "You're offline. Changes will sync when you reconnect."
- When reconnection is detected: banner transitions to green for 3 seconds — "Back online. Syncing your changes…" — then disappears.
- Banner is only shown in the User-facing app (`/app/dashboard`), not on the Admin panel.

#### 15.2.2 Read Strategy — Cache-First with Stale-While-Revalidate

For the question library (the card grid), `db.ts` follows this read strategy:

```
READ FLOW:

1. Check LocalStorage for cached question data (key: 'guesstimate:questions:cache')
   ├── Cache exists + age < 15 minutes?
   │     └── Return cache immediately (render cards instantly)
   │         Then fire background Supabase fetch
   │         └── On success: update cache + silently refresh React state
   │         └── On failure: keep showing cached data, no error shown
   │
   └── Cache absent or stale?
         └── Attempt live Supabase fetch
             ├── On success: store in cache with timestamp, return data
             └── On failure:
                   ├── Cache exists (even if stale)? → return stale cache
                   │   + show amber info toast: "Showing saved data. Couldn't reach server."
                   └── No cache at all? → show empty state with message:
                       "Couldn't load questions. Check your connection and refresh."
                       + Retry button (manual re-trigger of the fetch)
```

**Cache schema in LocalStorage:**

```typescript
// key: 'guesstimate:questions:cache'
interface QuestionsCache {
  fetchedAt: string;          // ISO timestamp
  questions: Question[];      // Full array of published question objects
}
```

Cache TTL: **15 minutes** for online sessions. For offline sessions, cache is used regardless of age until connectivity returns.

#### 15.2.3 Write Strategy — Sync Queue for Offline Writes

Any write operation that fails due to network unavailability is pushed into a **persistent sync queue** stored in LocalStorage. The queue drains automatically when connectivity is restored.

**Operations that enter the sync queue:**
- Mark question as Solved (`user_progress` upsert)
- Mark question as Retry (`user_progress` upsert)
- Remove Solved/Retry flag (`user_progress` upsert with `status = 'none'`)
- Save personal notes (`user_progress` update on `notes` field)
- Cast upvote or downvote (`user_votes` insert/update/delete)

**Operations that do NOT enter the sync queue** (admin-only, require live connection):
- Add / Edit / Delete questions
- Bulk upload
- Add / Edit / Delete users
- Add category

**Queue schema in LocalStorage:**

```typescript
// key: 'guesstimate:sync:queue'
interface SyncQueueItem {
  id: string;               // UUID, generated client-side
  operation: 'upsert_progress' | 'upsert_vote' | 'save_notes';
  payload: Record<string, unknown>;
  queuedAt: string;         // ISO timestamp
  retryCount: number;       // increments on each failed drain attempt
}
```

**Queue drain logic (runs on `window online` event and on every app load while online):**

```
drainSyncQueue():
  1. Load queue from LocalStorage
  2. If empty → return
  3. For each item in queue (oldest first):
       a. Attempt the Supabase operation with item.payload
       b. On success → remove item from queue
       c. On failure (network) → increment retryCount; leave in queue
       d. On failure (non-network, e.g. 400 Bad Request) → remove from queue
          (data is invalid; silently discard — do not retry indefinitely)
  4. If any items remain → log remaining count (dev only)
  5. If all drained → show brief success toast: "Your changes have been synced."
     (only if items were actually flushed this cycle)
```

**Queue safety rules:**
- Maximum queue size: **50 items**. If the queue is full and a new item arrives, the oldest item is dropped and a warning toast is shown: "Some changes couldn't be saved offline. Queue limit reached."
- Items are keyed by `(operation + user_id + question_id)` for deduplication. If the same question's progress is updated twice offline, the newer item replaces the older one in the queue rather than appending.
- On app load, if the queue has items and the user is online, drain runs immediately before the first data fetch. This ensures the server state is up to date before rendering.

---

### 15.3 Optimistic UI — Solved & Retry State Mutations

#### 15.3.1 What "Optimistic UI" Means Here

When a user clicks **Mark Solved** or **Mark Retry** in the Question Workspace modal, the UI must feel instant. Waiting for a server round-trip (typically 200–600ms) before updating the badge on the card creates perceptible lag that erodes the experience.

Optimistic UI means: **update the React state first, then confirm with the server.** If the server call fails, roll the state back silently and show a gentle fallback toast.

#### 15.3.2 Interaction Flow

```
User clicks "Mark Solved" in Question Workspace modal
│
├── Step 1 [Immediate — 0ms]:
│   Optimistically update local React state:
│   · question.userStatus = 'solved'   (was: 'none' or 'retry')
│   · Card badge in grid updates instantly to SOLVED
│   · "Mark Solved" button renders as active/filled
│   · "Mark Retry" button renders as inactive (mutual exclusivity)
│
├── Step 2 [Immediate — 0ms]:
│   Snapshot the previous state (for rollback):
│   · previousStatus = question.userStatus before change
│
├── Step 3 [Async — fires immediately after Step 1]:
│   Attempt db.upsertProgress({ questionId, status: 'solved', userId })
│   │
│   ├── SUCCESS (network call resolves):
│   │   · No UI change needed (already showing correct state)
│   │   · If offline queue had this item, remove it
│   │   · No toast shown (silent success)
│   │
│   └── FAILURE (network error or Supabase error):
│       · Roll back React state: question.userStatus = previousStatus
│       · Card badge reverts to previous state
│       · If isOnline = false:
│         → Push operation to sync queue
│         → Show amber toast: "Saved offline. Will sync when reconnected."
│         → UI keeps the optimistic state (don't roll back — queue will handle it)
│       · If isOnline = true (genuine server error):
│         → Roll back UI
│         → Show red toast: "Couldn't save. Please try again."
```

**Key distinction:** If the failure is a network drop (`isOnline = false`), the optimistic state is **kept** (not rolled back) because the sync queue will eventually persist it. If the failure is a server-side error while online, the state **is rolled back** because the data was definitively rejected.

#### 15.3.3 Applying the Same Pattern to Votes

The upvote / downvote interaction in the Question Workspace modal follows the identical pattern:

```
User clicks upvote (thumbs-up)
│
├── Snapshot: previousVote = question.userVote  (null | 'up' | 'down')
├── Optimistic update:
│   · If previousVote = 'up'  → set to null (toggle off); decrement upvotes display count
│   · If previousVote = 'down'→ set to 'up'; decrement downvotes, increment upvotes
│   · If previousVote = null  → set to 'up'; increment upvotes display count
│
├── Attempt db.upsertVote(...)
│   ├── SUCCESS → no UI change, silent
│   └── FAILURE (network) → push to sync queue, keep optimistic state, amber toast
│   └── FAILURE (server)  → rollback to previousVote + previousCounts, red toast
```

Note: Vote counts displayed on cards and in the workspace are **local display counts** derived from the optimistic state. The canonical counts live in `questions.upvotes` / `questions.downvotes` on the server and are refreshed on next fetch.

#### 15.3.4 Notes Save — Non-Optimistic Exception

The "Save Notes" action in the Question Workspace modal is **not optimistic** — it uses the standard async pattern with a loading spinner on the button and a success/error toast. Notes are long-form text that should not silently queue; the user should know explicitly whether their notes were saved. Notes **do** enter the sync queue if offline.

---

### 15.4 React State Management for Optimistic Updates

TanStack Query is used for all server state. Optimistic updates are implemented using TanStack Query's built-in `onMutate` / `onError` / `onSettled` mutation lifecycle:

```typescript
// Pseudocode — agent should implement this pattern in the progress mutation hook

const markSolvedMutation = useMutation({
  mutationFn: (variables) => db.upsertProgress(variables),

  onMutate: async (variables) => {
    // Cancel any in-flight fetches for this query key
    await queryClient.cancelQueries({ queryKey: ['userProgress'] });

    // Snapshot current state
    const previousProgress = queryClient.getQueryData(['userProgress']);

    // Optimistically update the cache
    queryClient.setQueryData(['userProgress'], (old) =>
      old.map((item) =>
        item.questionId === variables.questionId
          ? { ...item, status: variables.status }
          : item
      )
    );

    // Return snapshot for rollback
    return { previousProgress };
  },

  onError: (error, variables, context) => {
    if (isNetworkError(error)) {
      // Push to sync queue, keep optimistic state
      db.enqueueSyncItem({ operation: 'upsert_progress', payload: variables });
      toast.amber('Saved offline. Will sync when reconnected.');
    } else {
      // Roll back
      queryClient.setQueryData(['userProgress'], context.previousProgress);
      toast.error("Couldn't save. Please try again.");
    }
  },

  onSettled: () => {
    // Always refetch after mutation settles to reconcile server state
    queryClient.invalidateQueries({ queryKey: ['userProgress'] });
  },
});
```

The same `onMutate` / `onError` / `onSettled` structure applies to the vote mutation.

---

### 15.5 UX Copy — All States

All toasts and banners related to the offline/sync layer:

| Trigger | Type | Message |
|---------|------|---------|
| App goes offline | Amber banner (persistent until online) | "You're offline. Changes will sync when you reconnect." |
| App comes back online | Green banner (auto-dismiss 3s) | "Back online. Syncing your changes…" |
| Sync queue fully drained | Green toast (auto-dismiss 3s) | "Your changes have been synced." |
| Sync queue item discarded (server error) | Silent — no toast | — |
| Offline write queued (Solved/Retry/Vote) | Amber toast | "Saved offline. Will sync when reconnected." |
| Online write failed — server error | Red toast | "Couldn't save. Please try again." |
| Notes saved successfully | Green toast | "Notes saved." |
| Notes save failed — network | Amber toast | "Notes saved offline. Will sync when reconnected." |
| Notes save failed — server | Red toast | "Couldn't save notes. Please try again." |
| Cache stale, server unreachable | Amber toast (one-time per session) | "Showing saved data. Couldn't reach server." |
| No cache and server unreachable | Inline empty state | "Couldn't load questions. Check your connection and refresh." + Retry button |
| Sync queue full (50 items) | Amber toast | "Some changes couldn't be saved offline. Queue limit reached." |

---

### 15.6 LocalStorage Key Registry

All LocalStorage keys used by the application, in one place to avoid collisions:

| Key | Contents | TTL / Eviction |
|-----|----------|---------------|
| `guesstimate:questions:cache` | Cached published questions array + fetchedAt timestamp | Refreshed every 15 min when online; used indefinitely offline |
| `guesstimate:sync:queue` | Array of `SyncQueueItem` objects | Items removed on successful drain; max 50 items |
| `supabase.auth.token` | Supabase session token (managed by Supabase SDK) | Managed by Supabase; do not read or write manually |

**Scope:** LocalStorage is per-browser, per-origin. If the user logs in on a different device, the sync queue on the original device will still drain the next time that device comes online and is authenticated.

---

### 15.7 Admin Panel — Offline Behaviour

The Admin panel (`/admin/dashboard`) does **not** participate in the offline resilience layer. All admin operations require a live Supabase connection. If the admin loses connectivity:

- All admin action buttons (Add, Edit, Delete, Bulk Upload) are disabled
- A full-width red banner replaces the normal amber user banner: "Admin panel requires a live connection. Please check your network."
- The table data remains visible (read-only) from the last successful fetch — it is not cached to LocalStorage
- No sync queue is maintained for admin operations

---

*End of PRD — Guesstimate v1.0*
