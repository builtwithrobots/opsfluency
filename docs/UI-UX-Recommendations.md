# OpsFluency — Elite UI/UX Recommendations

> Reviewed against `ui-ux-pro-max` design intelligence database.  
> Codebase state at time of review: design system 95% complete, dashboard 60%, employee PWA 0%.  
> Last updated: April 2026

---

## What Already Works Well

The following are production-quality — keep them as-is:

- **Brand palette** — Teal `#14B8A6` anchor + 7-color signal system (cyan / emerald / amber / red / blue / gray / purple) is correct for an ops SaaS product
- **Component library** — 30+ accessible UI primitives in `components/ui/` with WCAG 2.1 AA compliance, focus rings, skip links, and reduced-motion support throughout
- **Typography** — Chakra Petch (display) + Inter (body) + JetBrains Mono (code) — industrial precision meets frontline readability
- **Light/dark theme** — pre-paint FOUC prevention via `components/theme/theme-script.ts`, full `--dc-*` token system
- **Animations** — Framer Motion with `prefers-reduced-motion` guard, 150–300ms timing, ease-out enters
- **Dashboard shell** — collapsible sidebar, role-based nav, localStorage drag ordering, mobile-responsive

---

## Surface 1: Manager Dashboard

### Rec 1 — SOP Status Pipeline: Horizontal Stage Rail `HIGH`

The SOP lifecycle (`draft → pending_terms → pending_translation → pending_approval → published → archived`) must be scannable at a glance. No SOP list page currently exists.

**What to build:**
- Sticky horizontal stage rail at the top of `/dashboard/sops` — one chip per status showing count, colored with signal tokens
- Clicking a chip filters the table below to that status
- Each SOP row uses the existing `Badge` component (`components/ui/badge.tsx`) with `signal-warn`, `signal-ok`, etc.
- Row actions change contextually per status: "Review Terms" for `pending_terms`, "Approve Spanish" for `pending_approval`, "View QR" for `published`

**Files:**
- `app/dashboard/sops/page.tsx` *(create)*
- `components/dashboard/SopStageRail.tsx` *(create)*

---

### Rec 2 — SOP Import: Multi-Step Wizard with Progress Rail `HIGH`

The 10-step pipeline is complex. A wizard with a visible progress rail makes the hard gate (terms review before translation) feel intentional, not arbitrary.

**What to build:**
- Top progress bar: steps 1–10, current step in teal, completed steps with checkmark, blocked steps grayed
- Each step is a full-page form — back/forward buttons at the bottom, no tabs
- Step 4 (terms review) shows a prominent amber `Alert` component: *"Translation is locked until all flagged terms are defined"*
- Step 6 (Markdown review): split-pane diff — original doc left, converted Markdown right
- Step 9 (Spanish approval): bilingual two-column layout (EN left, ES right) with sticky approval bar at bottom

**Files:**
- `app/dashboard/import/page.tsx` *(create)*
- `components/dashboard/ImportWizard.tsx` *(create)*
- `components/dashboard/SopDiffView.tsx` *(create)*

**Reuse:** `components/ui/alert.tsx` for the hard-gate warning

---

### Rec 3 — Glossary: Term Card Grid with Inline Edit `MEDIUM`

The glossary is the core technical moat. It should feel like a curated living document, not a raw table.

**What to build:**
- Card grid: 3-col desktop, 2-col tablet, 1-col mobile
- Each card: `term_en` as heading, `definition_en` as body, `term_es` chip below using `Badge`
- Clicking a card flips to inline edit mode in place — no modal
- Empty state: *"Add your first term — glossary terms are injected into every SOP conversion and translation"*
- Bulk CSV import button in the top-right action bar

**Files:**
- `app/dashboard/glossary/page.tsx` *(create)*
- `components/dashboard/GlossaryCard.tsx` *(create)*

---

### Rec 4 — Announcements: Compose with Audience Preview `MEDIUM`

Managers need confidence the right people will see their message. An audience preview panel solves the "did this reach my team?" anxiety.

**What to build:**
- Compose form: title, body, department selector (or "All departments")
- Live audience preview on the right: *"This announcement will reach 34 employees across 2 departments"* — updates as the department selector changes
- Published announcements show a read-receipt count badge (e.g. "12/34 viewed")
- Tabs using `DashboardTabs`: Compose / Published / Scheduled

**Files:**
- `app/dashboard/announcements/page.tsx` *(create)*
- `components/dashboard/AnnouncementComposer.tsx` *(create)*

**Reuse:** `components/dashboard/dashboard-tabs.tsx`

---

### Rec 5 — Analytics: Scan Activity Timeline `MEDIUM`

MVP analytics = scan counts per SOP over time. Keep it focused — no data overload.

**What to build:**
- Bar chart (recharts) showing daily scan counts for the last 30 days — use `--color-signal-live` (`#06B6D4`) bars
- Top SOPs table ranked by scan count, with a small inline sparkline per row
- Department filter dropdown + date range selector (7d / 30d / 90d)
- Empty state: *"No scans yet — publish a SOP and share its QR code"*

**Files:**
- `app/dashboard/analytics/page.tsx` *(create)*
- `components/dashboard/ScanChart.tsx` *(create)*

---

### Rec 6 — Dashboard Home: Live Stat Cards `MEDIUM`

The four `DashboardStatCard` components currently use hardcoded `"—"` placeholders. They need real data.

**What to build:**
- Single `Promise.all` in the Server Component fetching: published SOP count, team member count, 7-day scan count, pending-approval count
- Add "Pending Approvals" card with `signal-warn` (amber) accent — most actionable metric
- Add "Scans Today" card with `signal-live` (cyan) accent
- Recent activity feed: real SOP status transitions and scan events, not the static `EmptyActivityCard`

**File:** `app/dashboard/page.tsx` *(modify)*

---

## Surface 2: Employee PWA

> **Priority: CRITICAL.** The PWA is the product's core value delivery surface. Workers in warehouses — often gloved, in variable lighting, on spotty WiFi — need instant, language-correct SOP access. Nothing here should wait.

---

### Rec 7 — PWA Manifest + Service Worker `CRITICAL`

Nothing else on this surface matters until workers can install and use it offline.

**What to build:**
- `public/manifest.json`:
  ```json
  {
    "name": "OpsFluency",
    "short_name": "OpsF",
    "theme_color": "#14B8A6",
    "background_color": "#0C0E14",
    "display": "standalone",
    "orientation": "portrait",
    "start_url": "/app/home",
    "icons": [
      { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
    ]
  }
  ```
- Icons at `public/icons/icon-192.png` and `public/icons/icon-512.png`
- Configure `next-pwa` in `next.config.js`: cache-first for `/app/sop/*`, network-first for `/app/home`
- Offline fallback page at `app/offline/page.tsx` — show last-cached SOPs list with a "You're offline — showing saved content" banner

**Files:**
- `public/manifest.json` *(create)*
- `public/icons/` *(create)*
- `next.config.js` *(create)*
- `app/offline/page.tsx` *(create)*

---

### Rec 8 — Bottom Navigation: 4 Items, Glove-Friendly `CRITICAL`

Workers navigate with gloves. Every tap target must be enormous and forgiving.

**What to build:**
- Fixed bottom nav bar, **72px tall** (not 56px), 4 items: **Home · Search · HR · Scan**
- Each item: 60px tall touch target, 28px icon above 13px label, active state = teal fill on icon + teal label
- Scan item opens the device camera via the existing `/app/scan` route
- Bar sits above the home indicator safe area (`padding-bottom: env(safe-area-inset-bottom)`)
- No hover states anywhere in the PWA — tap-only affordances
- Content area gets `padding-bottom: 72px` so nothing hides behind the bar

**Files:**
- `app/app/layout.tsx` *(create)*
- `components/app/BottomNav.tsx` *(create)*

---

### Rec 9 — SOP Viewer: Bilingual Layout with Language Toggle `CRITICAL`

The bilingual SOP viewer is OpsFluency's highest-visibility UI moment for workers.

**What to build:**
- Default: render the employee's `preferred_language` from the `employees` table
- Sticky language toggle bar at top: `EN` and `ES` chips — switching swaps content without page reload
- `lang` attribute on the content container updates dynamically: `<article lang="es">` or `<article lang="en">`
- Template renderers:
  - `step-by-step`: numbered cards (not bare `<ol>`), each step a tappable card with 56px min-height
  - `safety-checklist`: checkbox cards with hazard icons
  - `reference`: section headers with jump-to navigation
  - `onboarding`: welcoming tone with contact card at bottom
- Safety warnings: full-width amber/red callout cards with a warning icon — must be impossible to miss
- Offline badge in header if SOP was served from cache

**Files:**
- `app/app/sop/[id]/page.tsx` *(create)*
- `components/sop/SopViewer.tsx` *(create)*
- `components/sop/LanguageToggle.tsx` *(create)*

---

### Rec 10 — Employee Home: Announcement Banner + Department SOPs `HIGH`

One-tap access to department SOPs and active announcements on the home screen.

**What to build:**
- Top: full-width announcement banner if an active announcement exists — amber background for safety alerts, teal for info
- Below: horizontally scrollable department chip row — worker's primary department pre-selected
- Under each chip: 1-column SOP list, full-width cards
- Each SOP card: **80px tall**, tappable anywhere, chevron right — large enough for gloved hands — shows title, last updated, and a language badge (EN+ES or EN only)
- Pull-to-refresh updates announcements; SOP content stays cache-first

**Files:**
- `app/app/home/page.tsx` *(create)*
- `components/app/AnnouncementBanner.tsx` *(create)*
- `components/app/SopCard.tsx` *(create)*

---

### Rec 11 — PWA Typography Scale: Larger Than Dashboard `HIGH`

Dashboard typography is tuned for desk users with a mouse. PWA users are moving, gloved, in warehouse lighting.

**Target scale (scoped to `/app` route group):**

| Element | Size | Line Height |
|---|---|---|
| Body text | 18px | 1.7 |
| SOP step text | 20px | 1.7 |
| Safety warning text | 22px bold | 1.6 |
| Section headings | 24px | 1.4 |
| Navigation labels | 13px | 1.2 |

Use 1.7 line height (not 1.5) — warehouse lighting and motion demand more breathing room.

**File:** `app/app/layout.tsx` *(scoped CSS class on the route group wrapper)*

---

### Rec 12 — Search: Instant Filter, No Round-Trip `MEDIUM`

Workers search for procedures when they can't find the QR code. Speed is critical.

**What to build:**
- `inputmode="search"` on the search input (triggers search keyboard on mobile)
- Pre-fetch full published SOP list on page load, filter client-side — results within 100ms of keystroke
- Each result card: department chip, last-updated date, language availability (EN only vs EN+ES)
- Empty state: *"No SOPs match — ask your manager to create one"*

**File:** `app/app/search/page.tsx` *(create — Client Component)*

---

## Surface 3: Monitor Display

### Rec 13 — Typography: Fixed Pixel Sizes, Not Responsive `CRITICAL`

TV monitors are viewed from 10–15 feet away. Responsive text sizes are wrong here — use literal pixel values.

| Element | Size | Weight |
|---|---|---|
| Department name | 64px | Bold |
| Announcement headline | 48px | Bold |
| Announcement body | 36px | Regular |
| Clock / date | 28px | Regular |
| Ticker / footer text | 16px | Regular |

**Rule:** Never use `text-xl` or similar responsive Tailwind classes on monitor routes. Use `text-[64px]`, `text-[48px]`, etc.

**File:** `app/monitor/[id]/page.tsx` *(create)*

---

### Rec 14 — Layout: 3-Zone Display `HIGH`

Design the monitor as a multi-zone layout now so Phase 2 content modules slot in without a redesign.

**Zone breakdown:**

```
┌─────────────────────────────────────────┐
│  Logo   │  Department Name  │   Clock   │  ← 10% height (top bar)
├─────────────────────────────────────────┤
│                                         │
│          Primary content zone           │  ← 75% height (main)
│   (announcement / SOP of day / etc.)   │
│                                         │
├─────────────────────────────────────────┤
│  Ticker ············  ● heartbeat  [⛶]  │  ← 15% height (bottom bar)
└─────────────────────────────────────────┘
```

- Top bar: company logo left, department name center, live clock right
- Main zone: primary content — announcement or placeholder for Phase 2 modules
- Bottom bar: scrolling ticker of recent announcements + pulsing teal heartbeat dot + fullscreen toggle

**Files:**
- `app/monitor/[id]/page.tsx` *(create)*
- `components/monitor/MonitorLayout.tsx` *(create)*
- `components/monitor/HeartbeatBar.tsx` *(create)*

---

### Rec 15 — Auto-Refresh with Stale-Content Guard `MEDIUM`

Monitors run unattended for months. Content freshness must be guaranteed without a jarring hard reload.

**What to build:**
- Poll `POST /api/monitors/heartbeat` every 30 seconds
- If `last_content_updated_at` in the response is newer than the current render timestamp → soft re-fetch via `router.refresh()` (no flash)
- If heartbeat fails 3 consecutive times → subtle amber border pulse around the screen edge (not a modal — content must stay visible)
- If heartbeat fails for >5 minutes → full page reload

---

## Cross-Cutting

### Rec 16 — Loading Skeletons on Every Async Boundary `HIGH`

Server Components that fetch data currently produce blank flashes. Every route segment needs a skeleton.

**What to build:**
- `loading.tsx` in every dashboard route segment — skeleton cards matching the shape of real content
- Use `animate-pulse` with `bg-(--color-dc-overlay)` as the skeleton background color
- PWA SOP viewer: skeleton showing 5 numbered step blocks while content loads

---

### Rec 17 — Toast System: Global Success + Error Feedback `MEDIUM`

Server Actions return `{ ok, error }` but there is no global toast layer. Mutations silently succeed or fail.

**What to build:**
- Install `sonner` (standard for Next.js App Router)
- Mount `<Toaster>` in the root layout
- Behavior:
  - Success: auto-dismiss after 3s, bottom-right on desktop, bottom-center on PWA
  - Error: does **not** auto-dismiss, includes a retry affordance, 5s minimum display
- Wire into every Server Action call site in the dashboard

---

### Rec 18 — Empty State Standardization `LOW`

Empty states exist on the QR library page but not on any of the new pages. Standardize the pattern.

**Canonical shape:**
```tsx
<EmptyState
  icon={<FileText className="w-10 h-10 text-(--color-dc-text-3)" />}
  heading="No SOPs yet"
  description="Upload a document to create your first SOP."
  action={<Button href="/dashboard/import">Import SOP</Button>}
/>
```

Extract `EmptyState` from the existing QR library empty state — don't duplicate.

---

## Priority Order

| # | Recommendation | Surface | Priority |
|---|---|---|---|
| 7 | PWA manifest + service worker | Employee PWA | CRITICAL |
| 8 | Bottom nav — glove-friendly | Employee PWA | CRITICAL |
| 9 | Bilingual SOP viewer | Employee PWA | CRITICAL |
| 13 | Monitor fixed-size typography | Monitor | CRITICAL |
| 1 | SOP stage rail | Dashboard | HIGH |
| 2 | Import wizard | Dashboard | HIGH |
| 10 | Employee home | Employee PWA | HIGH |
| 11 | PWA typography scale (18px+) | Employee PWA | HIGH |
| 14 | Monitor 3-zone layout | Monitor | HIGH |
| 16 | Loading skeletons | All | HIGH |
| 3 | Glossary card grid | Dashboard | MEDIUM |
| 4 | Announcements composer | Dashboard | MEDIUM |
| 5 | Analytics scan chart | Dashboard | MEDIUM |
| 6 | Dashboard live stat cards | Dashboard | MEDIUM |
| 12 | Search (instant filter) | Employee PWA | MEDIUM |
| 15 | Monitor auto-refresh guard | Monitor | MEDIUM |
| 17 | Toast system | All | MEDIUM |
| 18 | Empty state standardization | All | LOW |

---

## Key Files to Create

```
public/manifest.json
public/icons/icon-192.png
public/icons/icon-512.png
next.config.js
app/offline/page.tsx
app/app/layout.tsx
app/app/home/page.tsx
app/app/sop/[id]/page.tsx
app/app/search/page.tsx
app/dashboard/sops/page.tsx
app/dashboard/import/page.tsx
app/dashboard/glossary/page.tsx
app/dashboard/announcements/page.tsx
app/dashboard/analytics/page.tsx
components/app/BottomNav.tsx
components/app/SopCard.tsx
components/app/AnnouncementBanner.tsx
components/sop/SopViewer.tsx
components/sop/LanguageToggle.tsx
components/dashboard/SopStageRail.tsx
components/dashboard/ImportWizard.tsx
components/dashboard/SopDiffView.tsx
components/dashboard/GlossaryCard.tsx
components/dashboard/AnnouncementComposer.tsx
components/dashboard/ScanChart.tsx
components/monitor/MonitorLayout.tsx
components/monitor/HeartbeatBar.tsx
```

## Key Files to Modify

```
app/dashboard/page.tsx        — wire live stat counts
app/app/layout.tsx            — PWA typography scale + bottom nav
app/monitor/[id]/page.tsx     — fixed-type monitor layout
```

## Existing Patterns to Reuse

| Pattern | File |
|---|---|
| Status badges | `components/ui/badge.tsx` — use `signal-warn`, `signal-ok`, etc. |
| Hard-gate warnings | `components/ui/alert.tsx` |
| Tab navigation | `components/dashboard/dashboard-tabs.tsx` |
| Dashboard page wrapper | `components/dashboard/app-shell.tsx` |
| Signal color tokens | `app/globals.css` — never hardcode hex in new components |
| Auth + company context | `lib/auth/company-context.ts` → `getCompanyContext()` |
| Supabase data fetching | `lib/supabase/server.ts` → `getRequestClient()` |

## Verification Checklist

```bash
# After any TypeScript change
npx tsc --noEmit

# Lint
npm run lint

# Accessibility — run against each new surface
npx @axe-core/cli <preview-url>/app/home
npx lighthouse <preview-url>/app/home --only-categories=accessibility --quiet
# Target: zero wcag2a/wcag2aa violations, Lighthouse a11y ≥ 95
```

**Manual checks:**
- Employee PWA: test at 375px, simulate gloved hand by clicking only the center of elements
- Monitor: open at 1920×1080 and verify all text is legible from 10 feet
- Dark mode: toggle and confirm signal colors (amber/red/cyan) remain visually distinct
- Reduced motion: enable in OS → all Framer Motion animations reduce to opacity-only
