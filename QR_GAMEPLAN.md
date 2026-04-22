# QR Code System — Implementation Gameplan

> Written: 2026-04-22  
> Branch: `claude/audit-qr-code-system-CQiuy`

---

## What We're Building

A **polymorphic QR code primitive** that any OpsFluency module can attach to. QR codes are not SOP-specific — they can point to SOPs, announcements, questionnaire modules, or any future target type. The scan URL is permanent and target-type-agnostic.

---

## DockClarity Audit — What We're Copying vs. Improving

### Copy (battle-tested)
- Permanent `/s/[qr_code_id]` scan route that never changes
- `qrcode.react` `<QRCodeSVG>` rendering
- Live print preview with `transform: scale()` on a fixed 768×1008pt container
- DotSlider for QR size control
- Accordion section layout (Logo / Header / Sub-header / QR / Footer / Footer 2)
- Logo from company record, phone number as Footer 2 default
- `window.print()` with `@media print` CSS to hide chrome

### Improve (known DockClarity gaps)
| DockClarity weakness | Our fix |
|---|---|
| Print config resets on reload | Persist print config as JSONB on `qr_codes.print_config` |
| Single hardcoded template | Per-target-type template system (`TargetType` enum) |
| No scan logging | `sop_scans` → renamed `qr_scans` table, logs every scan |
| No 410 on deleted content | `/s/[id]` returns HTTP 410 with friendly page when content is archived/deleted |
| QR tied to dock row | QR is its own row; target resolved at scan time via `target_type + target_id` |

---

## Data Model

### `qr_codes` table
```sql
CREATE TABLE qr_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID REFERENCES companies(id) ON DELETE CASCADE,
  target_type   TEXT NOT NULL,  -- 'sop' | 'announcement' | 'questionnaire' | 'url'
  target_id     UUID,           -- nullable for type='url'
  target_url    TEXT,           -- only used for type='url'
  label         TEXT NOT NULL DEFAULT '',
  print_config  JSONB NOT NULL DEFAULT '{}',
  created_by    TEXT NOT NULL,  -- clerk_user_id
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (target_type = 'url' AND target_url IS NOT NULL) OR
    (target_type != 'url' AND target_id IS NOT NULL)
  )
);

ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY qr_codes_company_isolation ON qr_codes
  FOR ALL TO authenticated
  USING      (company_id = requesting_company_id() OR is_super_admin())
  WITH CHECK (company_id = requesting_company_id() OR is_super_admin());
```

### `qr_scans` table
```sql
CREATE TABLE qr_scans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id   UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
  company_id   UUID REFERENCES companies(id) ON DELETE CASCADE,
  scanned_by   TEXT,          -- clerk_user_id, nullable (pre-auth scan)
  ip_hash      TEXT,          -- SHA-256 of IP for rate-limit dedup, not raw IP
  user_agent   TEXT,
  scanned_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY qr_scans_company_isolation ON qr_scans
  FOR ALL TO authenticated
  USING      (company_id = requesting_company_id() OR is_super_admin())
  WITH CHECK (company_id = requesting_company_id() OR is_super_admin());
```

### `print_config` JSONB shape
```typescript
interface PrintConfig {
  qr_size: number;           // 40–90 (% of container width), default 60
  header: string;            // default: SOP/announcement title
  sub_header: string;        // default: ''
  footer: string;            // default: ''
  footer2: string;           // default: company phone number
  show_logo: boolean;        // default: true
  template: PrintTemplate;   // per target type (see below)
}

type PrintTemplate =
  | 'sop-standard'       // numbered steps icon, "Scan to view procedure"
  | 'announcement'       // megaphone icon, "Scan for latest update"
  | 'questionnaire'      // clipboard icon, "Scan to complete form"
  | 'generic';           // no icon, minimal
```

---

## Scan URL Shape

```
https://<NEXT_PUBLIC_APP_URL>/s/<qr_code_id>
```

- `qr_code_id` is the UUID from `qr_codes.id` — never the `target_id`
- URL never changes after generation
- `/s/[qr_code_id]` is a public route (excluded from Clerk auth middleware in `proxy.ts`)

---

## Routing Logic at `/s/[qr_code_id]`

```
1. Look up qr_codes row by id
   → Not found: 404 page
2. Resolve target:
   target_type = 'sop':
     → Fetch sops row by target_id
     → status = 'archived': HTTP 410 "No longer available" page
     → else: continue
   target_type = 'url':
     → target_url is the destination
   target_type = 'announcement' | 'questionnaire':
     → resolve destination route per module (future — fall through to generic for now)
3. Log scan asynchronously via POST /api/qr/scans (fire-and-forget, unauthenticated)
4. Auth gate:
   → Clerk session exists: redirect to resolved destination
   → No session: redirect to /sign-in?redirect_url=<destination>
```

---

## API Routes

| Route | Auth | Purpose |
|---|---|---|
| `POST /api/qr` | Clerk session (manager+) | Create a new QR code row |
| `GET /api/qr/[id]` | Clerk session | Fetch QR + print_config |
| `PATCH /api/qr/[id]` | Clerk session (manager+) | Update label or print_config |
| `DELETE /api/qr/[id]` | Clerk session (admin+) | Delete QR code |
| `POST /api/qr/scans` | None (public) | Log a scan (rate-limited by IP + qr_code_id) |

`POST /api/qr/scans` is the **only** unauthenticated write route. Rate limit: 10 scans per IP per QR per minute (in-memory sliding window for MVP, Redis in Phase 2).

---

## File Structure

```
app/
  s/[qr_code_id]/
    page.tsx              ← scan landing (public, server component)
    gone.tsx              ← 410 "no longer available" component
  api/
    qr/
      route.ts            ← POST (create)
      [id]/
        route.ts          ← GET, PATCH, DELETE
      scans/
        route.ts          ← POST (public, rate-limited)
  dashboard/
    qr/
      page.tsx            ← QR code list (manager view)
      [id]/
        page.tsx          ← QR detail + print editor

components/
  qr/
    QRPrintEditor.tsx     ← full print config UI (accordion sections)
    QRPrintPreview.tsx    ← live preview (768×1008, transform:scale)
    QRCodeDisplay.tsx     ← renders <QRCodeSVG> with branding overlay
    DotSlider.tsx         ← size control (copied from DockClarity)
    PrintButton.tsx       ← triggers window.print()
    QRCard.tsx            ← compact card for list view

lib/
  qr/
    generate.ts           ← createQrCode() server util
    resolve.ts            ← resolveQrTarget() for scan landing
    print-config.ts       ← PrintConfig type + defaults per target type
    rate-limit.ts         ← in-memory scan rate limiter
```

---

## Print Editor UI — Section Breakdown

Mirrors DockClarity accordion layout, improved with persistence:

| Section | Controls | Default |
|---|---|---|
| **Logo & Company** | Toggle show/hide, logo preview | Show logo ON |
| **Header** | Text input | SOP/announcement title |
| **Sub-header** | Text input | '' |
| **QR Code** | DotSlider (size 40–90%) | 60% |
| **Template** | Radio (sop-standard / announcement / questionnaire / generic) | Per target type |
| **Footer** | Text input | '' |
| **Footer 2** | Text input | Company phone number |

All changes auto-save to `qr_codes.print_config` via debounced PATCH (500ms). No "Save" button — always-current state.

---

## Implementation Order

### Step 1 — Database migration
- `qr_codes` table + RLS policy
- `qr_scans` table + RLS policy
- `requesting_company_id()` and `is_super_admin()` helper functions (if not yet created)

### Step 2 — Core lib
- `lib/qr/print-config.ts` — types and defaults
- `lib/qr/generate.ts` — `createQrCode()` util
- `lib/qr/resolve.ts` — `resolveQrTarget()` util
- `lib/qr/rate-limit.ts` — IP rate limiter

### Step 3 — API routes
- `POST /api/qr` (create)
- `GET|PATCH|DELETE /api/qr/[id]`
- `POST /api/qr/scans` (public, rate-limited)

### Step 4 — Scan landing page
- `/s/[qr_code_id]/page.tsx` (server component)
- 410 "gone" page component
- Wire into `proxy.ts` as public route

### Step 5 — Print editor components
- `DotSlider.tsx`
- `QRCodeDisplay.tsx`
- `QRPrintPreview.tsx`
- `QRPrintEditor.tsx` (accordion, auto-save)
- `PrintButton.tsx` + print CSS

### Step 6 — Dashboard QR pages
- `/dashboard/qr/page.tsx` (list)
- `/dashboard/qr/[id]/page.tsx` (detail + editor)

### Step 7 — Typecheck + lint pass
- `npx tsc --noEmit`
- `npm run lint`

---

## What This Does NOT Build (yet)

- SOP → QR assignment UI (done inside the SOP pipeline when that module lands)
- Announcement → QR assignment (done inside announcements module)
- Questionnaire target type routing (stub 404 for now)
- Analytics dashboard for scan counts (Phase 2)
- Redis-backed rate limiting (in-memory is fine for MVP)
- QR code bulk generation or CSV export

---

## Key Constraints from CLAUDE.md

- QR URL shape: `${NEXT_PUBLIC_APP_URL}/s/<qr_code_id>` — never `sop_id` in the URL
- Archived SOP → HTTP 410, not 404
- `/s/[qr_code_id]` excluded from Clerk middleware matcher in `proxy.ts`
- Scan logging route must accept unauthenticated calls
- All new tables: RLS enabled + `_company_isolation` policy + `OR is_super_admin()` in both USING and WITH CHECK
- `SUPABASE_SERVICE_ROLE_KEY` only in `lib/supabase/admin.ts`
- Minimum 44px touch targets, WCAG 2.1 AA contrast on all UI
