# CLAUDE.md — OpsFluency

> This file is the project memory for Claude Code. Read it at the start of every session.
> Last updated: April 2026

---

## What This Project Is

OpsFluency is a frontline knowledge and engagement platform for multilingual warehouse and manufacturing facilities. It is NOT a translation tool. It is operations infrastructure that combines SOP management, bilingual publishing, QR-triggered learning, and departmental communication into one affordable, manager-driven system.

**The one-line pitch:** "Yourco broadcasts messages. OpsFluency enables competence."

**Independent codebase.** Has no shared infrastructure with DockClarity or any other project.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js App Router (TypeScript, strict mode) |
| Styling | Tailwind CSS |
| Auth | Clerk (auth only -- user identity and magic links, no Organizations feature) |
| Database | Supabase (PostgreSQL) -- independent project, fully separate from DockClarity |
| Storage | Supabase Storage -- independent project |
| AI Conversion | Claude Sonnet API (SOP to Markdown + glossary flagging -- quality-critical) |
| AI Lightweight | Claude Haiku API (high-frequency tasks in Phase 2 only) |
| Translation | Google Cloud Translation API (with glossary injection -- never use Claude for translation) |
| QR Codes | qrcode.react |
| PWA | next-pwa |
| Validation | Zod (schema validation at every server entry point) |
| Deployment | Vercel (auto-deploy from GitHub) |

---

## Commands

Claude runs these to verify its own work. All are safe to run in any session.

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server (Next 16 + Turbopack). Usually unnecessary in Claude Code sessions; the Vercel preview URL is the primary dev surface. |
| `npm run build` | Production build. Run to confirm a change doesn't break the build. |
| `npm run lint` | ESLint via `next lint`. |
| `npx tsc --noEmit` | Typecheck. **Run this after any non-trivial TypeScript change.** |

After a command fails, fix the underlying issue before moving on. Do not suppress type errors with `@ts-ignore` or `any` — ask for clarification instead.

---

## Skills

Project-specific skills live in `.claude/skills/` and auto-trigger by description. When a skill and this file disagree, **`CLAUDE.md` is the spec and wins** — drift in a skill is a bug to fix in the skill.

| Skill | When it triggers | What it owns |
|---|---|---|
| `opsfluency-sop-pipeline` | Any code touching `sops`, `sop_versions`, `glossary_terms`, `qr_codes`, or the import → convert → flag → translate → publish flow | Pipeline order, glossary hard gate, Sonnet prompt rules, version management |
| `opsfluency-accessibility` | Any user-facing UI (employee PWA, manager dashboard, TV monitor) | OpsFluency-specific a11y on top of WCAG 2.1 AA — glove taps, warehouse lighting, TV distance, bilingual `lang` |
| `opsfluency-bilingual-content` | Any code rendering user strings or user-generated text, or gating by `employees.preferred_language` | System strings vs user-generated content, `content_en` / `content_es` columns, language toggle |

General-purpose skills (`frontend-design`, `react-best-practices`, `nextjs-skills`, `composition-patterns`, `planning-with-files`, `docx`, `pdf`) are available but optional. They carry no OpsFluency-specific rules.

---

## Project Structure

```
opsfluency/
├── app/
│   ├── (auth)/              # Clerk auth pages
│   ├── dashboard/           # Manager-facing pages
│   │   ├── sops/            # SOP list, create, edit
│   │   ├── import/          # SOP upload and conversion pipeline
│   │   ├── glossary/        # Company glossary management
│   │   ├── employees/       # Employee invitation and management
│   │   ├── announcements/   # Post and manage announcements
│   │   ├── departments/     # Department setup
│   │   ├── monitors/        # Monitor pairing and management
│   │   └── analytics/       # Scan analytics
│   ├── app/                 # Employee-facing PWA pages
│   │   ├── home/            # Employee dashboard (announcements + dept tabs)
│   │   ├── sop/[id]/        # SOP viewer (bilingual)
│   │   ├── scan/            # QR scan entry point
│   │   ├── hr/              # HR SOPs, contacts, chat
│   │   └── search/          # SOP search
│   ├── monitor/[id]/        # Departmental monitor display (TV fullscreen)
│   ├── pair-monitor/        # Monitor pairing flow
│   └── api/                 # API routes
│       ├── sops/
│       ├── import/
│       ├── glossary/
│       ├── translate/
│       ├── employees/
│       ├── announcements/
│       ├── monitors/
│       ├── analytics/
│       └── hr/
├── lib/
│   ├── auth/                # Clerk helpers, company context from Supabase
│   ├── supabase/            # Supabase client and typed helpers
│   ├── ai/                  # Sonnet conversion and glossary flagging
│   ├── translation/         # Google Cloud Translation with glossary injection
│   ├── qr/                  # QR generation utilities
│   └── types/               # Shared TypeScript types
├── components/
│   ├── sop/                 # SOP viewer, template renderers
│   ├── monitor/             # Monitor display components
│   ├── dashboard/           # Manager UI components
│   └── ui/                  # Shared UI primitives
├── public/
│   ├── manifest.json        # PWA manifest
│   └── sw.js                # Service worker (generated by next-pwa)
└── proxy.ts                 # Clerk proxy (Next 16 renamed middleware.ts → proxy.ts)
```

### Auth proxy (`proxy.ts`)

Next 16 renamed `middleware.ts` to `proxy.ts`. The file wires `clerkMiddleware()` and runs on every non-static route. The following routes are public (no Clerk session required) and must be excluded from any protected-route matcher added to `clerkMiddleware`:

- `/sign-in`, `/sign-up` — Clerk hosted auth flow
- `/monitor/[id]` — paired TV display, authenticated via signed pairing token in a cookie (not a Clerk session)
- `/pair-monitor` — one-time manager pairing flow that issues the monitor token
- `/s/[qr_code_id]` — QR scan landing page; redirects to `/app/sop/[id]` and triggers employee sign-in if no session exists

**Monitor auth.** A manager pairs a TV via `/pair-monitor` (manager-authenticated). The Server Action inserts a `monitors` row, then sets a signed, HttpOnly, SameSite=Lax cookie `opsf_monitor` on the TV's browser that contains `{ monitor_id, company_id, iat }` signed with `MONITOR_COOKIE_SECRET`. The cookie has no expiration (monitors run for months). `/monitor/[id]` reads and verifies the cookie server-side, rejects on signature mismatch or `monitor_id` mismatch, and loads content scoped to `company_id`. Rotate the secret by invalidating all monitor sessions and re-pairing — document this as the unpair flow, not an automatic rotation.

**QR scan auth.** `/s/[qr_code_id]` is public and stateless. It looks up `qr_codes.id`, resolves the current `published` SOP, and:
- If the SOP is `archived` → return HTTP 410 with a friendly "no longer available" page.
- If the employee has a Clerk session → redirect to `/app/sop/[sop_id]`.
- If no session → redirect to `/sign-in?redirect_url=/app/sop/[sop_id]` so Clerk lands them on the right SOP after magic-link auth.

The scan itself is logged asynchronously via `POST /api/sops/:id/scans` — this is the one `/api` route that must accept unauthenticated calls, rate-limited by IP + `qr_code_id`.

---

## Key Architectural Decisions

### company_id = Supabase UUID from companies table (NOT Clerk)

Clerk is used for user identity and magic links only. The Organizations feature is not used. Company/multi-tenancy is managed entirely in Supabase.

Every company-scoped Supabase table uses `company_id UUID` which references the `companies` table. User membership and roles are stored in a `company_members` junction table.

**Key tables for multi-tenancy:**

```sql
-- The company (replaces Clerk Organization)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Who belongs to which company and what role they have
CREATE TABLE company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee',
  -- 'admin' | 'manager' | 'employee'
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, clerk_user_id)
);

-- Cross-tenant god-mode allowlist. Super admins are NOT members of any
-- company, so they live outside company_members. See
-- "Super admin (cross-tenant god mode)" below for the full model.
CREATE TABLE super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Getting company context in API routes:**

```typescript
import { auth } from '@clerk/nextjs/server';
import { getRequestClient } from '@/lib/supabase/server';

// Always get company context from Supabase -- never from Clerk org
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await getRequestClient();

  // Look up which company this user belongs to and what role they have
  const { data: member } = await supabase
    .from('company_members')
    .select('company_id, role')
    .eq('clerk_user_id', userId)
    .single();

  if (!member) return NextResponse.json({ error: 'No company found' }, { status: 403 });

  const { company_id, role } = member;

  // Now filter all queries by company_id -- RLS will reject cross-tenant rows even if this is omitted
  const { data } = await supabase
    .from('sops')
    .select('*')
    .eq('company_id', company_id);

  return NextResponse.json({ data });
}
```

**Never use Clerk orgId anywhere.** company_id always comes from the `company_members` lookup.

### Supabase clients

Three clients, one purpose each. The import path tells you where each is safe to use.

- **`lib/supabase/server.ts`** — request-scoped authenticated client. Exports `getRequestClient()` which returns a Supabase client that forwards the Clerk-issued JWT as the Bearer token. Supabase validates the token (Clerk is configured as a third-party auth provider in the Supabase dashboard) and RLS policies read the caller's identity from `auth.jwt() ->> 'sub'`. Use this in every API route, Server Action, and Server Component. Operates as the `authenticated` role — **RLS is enforced**.
- **`lib/supabase/admin.ts`** — service-role client. Bypasses RLS. Server-only. Reserved for: migrations, the default-department seed on company creation, cron jobs, and cross-tenant analytics. Every import site must have a comment justifying why RLS bypass is required.
- **`lib/supabase/browser.ts`** — anon client for `"use client"` components. No elevated permissions. RLS-enforced via the anon role.

Hard rules:

- `SUPABASE_SERVICE_ROLE_KEY` is **only** read inside `lib/supabase/admin.ts`. Never import it from client code, never reference it outside that file.
- Never import `lib/supabase/admin` from a file that could end up in the browser bundle. Put `import 'server-only'` at the top of `admin.ts` to fail fast if someone tries.
- Server Components and API routes default to `getRequestClient` — reach for `admin` only when you've written down *why* RLS must be bypassed.

### Row Level Security (RLS)

**Decision:** RLS is enabled on every company-scoped table from day one, backed by a `requesting_company_id()` SQL helper. Justification: a single missed `.eq('company_id', ...)` in a server query would silently leak cross-tenant data. RLS makes that mistake impossible instead of just improbable, and adding it retroactively after the schema is 15 tables deep is painful.

Pattern:

```sql
-- Clerk issues a JWT per session. Supabase trusts Clerk as a third-party
-- auth provider and validates it as the Bearer token. The `sub` claim is
-- the Clerk user id.
CREATE OR REPLACE FUNCTION requesting_company_id() RETURNS uuid
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public, auth
AS $$
  SELECT cm.company_id
  FROM public.company_members cm
  WHERE cm.clerk_user_id = auth.jwt() ->> 'sub'
  LIMIT 1;
$$;

ALTER TABLE sops ENABLE ROW LEVEL SECURITY;

CREATE POLICY sops_company_isolation ON sops
  FOR ALL TO authenticated
  USING      (company_id = requesting_company_id() OR is_super_admin())
  WITH CHECK (company_id = requesting_company_id() OR is_super_admin());
```

Rules:

- Every new company-scoped table ships with `ENABLE ROW LEVEL SECURITY` and a `<table>_company_isolation` policy in the same migration that creates the table. No exceptions.
- Every tenant policy includes an `OR is_super_admin()` clause in both `USING` and `WITH CHECK` so god-mode tooling can reach every tenant. Omitting it locks super admins out of the table.
- Helpers (`requesting_company_id`, `requesting_role`, `is_super_admin`) are `SECURITY DEFINER` with `SET search_path = public, auth` — otherwise a policy on `company_members` that calls the helper recurses into itself.
- Server queries still include `.eq('company_id', company_id)` as defense in depth and because it lets Postgres pick the right index.
- Tables that are intentionally global (e.g., `companies` itself, which an admin needs to read their own row from) get a narrower policy — document why inline in the migration.
- The service-role client (`lib/supabase/admin.ts`) bypasses RLS. Treat every usage as a security-review-worthy line.

### Super admin (cross-tenant god mode)

There is exactly one role that sees every tenant's data: `super_admin`. It is **not** stored in `company_members` — a super admin is not a "member" of any single company. Instead, a dedicated `super_admins` table is keyed by `clerk_user_id`, and the `is_super_admin()` SQL helper resolves the current caller's status from their Clerk JWT.

Rules:

- Adding a super admin = inserting a row into `super_admins` via the service-role client (or the SQL editor). There is no signup flow for this role — it's a hardcoded allowlist.
- `super_admins` is locked at grant level (`REVOKE ALL ... FROM anon, authenticated`). No RLS policy needed; callers always go through `is_super_admin()` which runs `SECURITY DEFINER` and bypasses the grant.
- `getCompanyContext()` does **not** resolve super admins — it throws `NO_COMPANY` for them. Super-admin-only routes use a separate `getSuperAdminContext()` helper (to be added when the first such route lands).
- `requesting_role()` returns `NULL` for a super admin; check `is_super_admin()` first in any UI or policy that needs to differentiate.

### Data fetching: RSC + Server Actions, `/api` only for external callers

Default shape for every piece of session-authed server code:

- **Reads** — Server Components call Supabase directly via `getRequestClient()`. No API round-trip for data the UI renders.
- **Mutations** — Server Actions (`"use server"`), not API routes. Zod-validate the input at the top, run the write, call `revalidatePath` / `revalidateTag` before returning.
- **`/api` routes** — reserved for callers that don't have a Clerk session or can't invoke a Server Action:
  - Webhooks (Clerk user events; Paddle for self-serve billing and Stripe for at-scale/enterprise billing once those land)
  - Monitor heartbeat (`POST /api/monitors/heartbeat`, authenticated by the signed monitor-pairing cookie)
  - QR scan logging (`POST /api/sops/:id/scans`, callable from the public scan landing before the employee has signed in)
  - Cron jobs and external integrations

Rule of thumb: if the caller has a Clerk session and the code is reachable from the manager dashboard or employee PWA, it is a Server Action — not an API route.

### Default to Server Components

Every `.tsx` file in `app/` is a Server Component unless it explicitly opts out with `"use client"`. Opt in to client only when one of the following is actually required: React hooks (`useState`, `useEffect`, `useTransition`, etc.), browser APIs (`window`, `localStorage`, `navigator`), interactive DOM event handlers, or a third-party component that itself needs them.

If a file doesn't meet that bar, it must stay a Server Component — push the interactive subtree down into a small `*Client.tsx` child and keep the parent on the server. Client components can't fetch data with `getRequestClient`, can't read env vars beyond `NEXT_PUBLIC_*`, and bloat the JS bundle, so the default matters.

### SOP Conversion is a Multi-Step Pipeline -- Never One Shot
The SOP import pipeline has hard gates between steps. Do not skip or combine them:

1. Upload doc to Supabase Storage
2. Sonnet converts to Markdown (with full company glossary as context)
3. Sonnet flags site-specific terms (returns structured list)
4. Manager reviews and defines flagged terms **(HARD GATE -- translation cannot proceed until all terms are defined)**
5. Defined terms saved to glossary
6. Manager reviews/edits Markdown vs original doc
7. Manager selects template
8. Translation runs (Google Cloud + glossary override)
9. Manager approves Spanish version
10. Publish + QR code generated

### SOP status lifecycle

Every SOP has exactly one status. Transitions are one-way except `published → archived`, and each is gated by the pipeline:

```
draft
  └─→ pending_terms          (Sonnet flagged terms; waiting for manager definitions)
        └─→ pending_translation  (all terms defined; Google Translate can run)
              └─→ pending_approval   (Spanish draft ready for manager sign-off)
                    └─→ published        (live; QR code serves this version)
                          └─→ archived        (manager-initiated; QR returns 410)
```

Rules:

- Stored as Postgres `TEXT` with a `CHECK (status IN (...))` constraint on `sops`. Never hardcode the strings in UI or queries — import the union type and enum from `lib/types/sop.ts`.
- The Server Action that updates status must read the current status inside the same transaction and reject any transition not listed above.
- `archived` is terminal. Restoring means creating a new SOP that references the old one, not flipping the status back.
- English edits to a `published` SOP create a new `sop_versions` row and flip `sop_versions.needs_retranslation = true` on the previous Spanish — the `sops.status` stays `published` throughout.

**`needs_retranslation` flag.** `sop_versions.needs_retranslation BOOLEAN NOT NULL DEFAULT FALSE`. Set to `true` when the English side is edited; cleared only when a manager approves the re-translated Spanish. Employees continue seeing the last approved Spanish until the flag clears — never show a stale-flagged version in a way that suggests it's fresh, but also never hide it (partial content is worse than slightly-stale content).

### Translate-on-Publish, Not on Demand
Translation runs once at publish time, not on every employee page load. Both English and Spanish Markdown are stored in `sop_versions`. Employees get pre-translated content instantly.

### Glossary is Always Injected as Context
When calling Sonnet for conversion or Google Translate for translation, always fetch the full company glossary first and include it in the prompt/context. This is the core technical moat -- consistent terminology across all documents.

```typescript
// Pattern for every translation call
const { data: glossary } = await supabase
  .from('glossary_terms')
  .select('term_en, definition_en, term_es, definition_es')
  .eq('company_id', company_id); // company_id from company_members lookup

// Pass glossary to Google Cloud Translation -- never use Claude for translation
const translatedContent = await translateWithGlossary(content, 'es', glossary);
```

### Employee Auth = Magic Link Only
Employees never set passwords. They log in via Clerk magic links (expiring, 72 hours). After first login, their Clerk session persists. Their role and company membership live in the `company_members` table in Supabase -- not in Clerk. If the link expires, a manager resends from the employee management screen. Never implement password auth for the employee role.

### PWA Offline Strategy
Employees in warehouses have spotty WiFi. The service worker must cache:
- The employee's last-viewed SOPs (up to 20)
- The employee's home dashboard content
- Static assets

Use a cache-first strategy for SOP content, network-first for announcements.

### QR Codes are Permanent
A QR code URL never changes after generation. It always points to the current active version of the SOP. If an SOP is updated, the QR code still works -- it just serves the new content. QR codes only break on archive (return a user-friendly "no longer available" page).

**QR URL shape:** `${NEXT_PUBLIC_APP_URL}/s/<qr_code_id>`, where `qr_code_id` is `qr_codes.id` (UUID), permanent, and **never** the `sop_id`. The `/s/[qr_code_id]` route is public: it looks up the QR row, resolves the current `published` SOP, and redirects to `/app/sop/[id]`. If the SOP is `archived` the route returns HTTP 410 with a friendly "this procedure is no longer available — ask your manager" page (not a 404). If the employee has no Clerk session, redirect through sign-in while preserving the intended SOP id so the post-login redirect lands them on the content.

### Supabase Storage buckets

Two buckets, named explicitly so nothing tries to improvise:

| Bucket | Access | Contents | Signed URL TTL |
|---|---|---|---|
| `sop-uploads` | Private | Original PDF/DOCX/TXT files from managers, path `${company_id}/${sop_id}/${filename}` | 1 hour, regenerated per manager review session |
| `company-logos` | Public | Logos used in QR print headers and dashboard chrome | N/A (public read) |

Never store SOP uploads in a public bucket, even in dev. Never sign a URL with a TTL longer than an hour without explicit approval.

### Monitor System
Follows the DockClarity pairing pattern exactly. Monitors are TV screens that pair via QR code and run fullscreen in a browser. They auto-refresh and require no user interaction after pairing. MVP monitor content is placeholder -- the infrastructure is built first, content modules slot in during Phase 2.

---

## Supabase Tables (MVP)

All tables and their columns are defined in [`./PRD.md`](./PRD.md) (section 6). Key reminders:

- `companies` -- one row per customer company (replaces Clerk Organizations)
- `company_members` -- who belongs to which company and their role (admin/manager/employee)
- `super_admins` -- cross-tenant god-mode allowlist keyed by `clerk_user_id`; NOT part of any company
- `sops` -- master record, status lifecycle (see "SOP status lifecycle" above), no content stored here
- `sop_versions` -- content lives here, one row per publish
- `qr_codes` -- one per SOP, permanent, stores print config as JSONB
- `glossary_terms` -- company-scoped, English + Spanish, always injected into AI calls
- `employees` -- extended employee profile, preferred_language, last_active_at (clerk_user_id is the link to Clerk)
- `employee_departments` -- junction table, many-to-many
- `sop_scans` -- every QR scan or manual view logged here
- `announcements` -- department scoped or org-wide (department_id = null)
- `monitors` -- paired TV screens, department scoped
- `hr_contacts` / `hr_chats` / `hr_chat_messages` -- HR module tables

---

## SOP Template Styles

Four display templates are supported. Each is a React component that accepts Markdown and renders it in the appropriate style.

| Template Key | Display Style |
|---|---|
| `step-by-step` | Numbered steps, warnings in red/yellow callout boxes |
| `reference` | Section headers, subsections, table of contents if long |
| `safety-checklist` | Checkbox list format, hazard icons, prominent warnings |
| `onboarding` | Welcoming tone, section navigation, contact cards at bottom |

All templates: minimum 16px body text, high contrast, WCAG 2.1 AA compliant.

---

## Departments (Default on Account Creation)

When a new org is created, seed these four departments automatically:

- Safety
- Equipment
- Process
- HR

HR department has additional features beyond standard departments (contacts, chat). All other departments are view-only for employees.

**How seeding runs.** In the Server Action that creates a new `companies` row (fired on first sign-up of an admin). **Not** a Postgres trigger — the Server Action is visible in code, testable, and runs inside the same transaction as the `company_members` insert. The four departments are inserted with `company_id` set to the new company's id, and the seed is idempotent (safe to re-run against an existing company via `ON CONFLICT DO NOTHING`).

---

## User Roles and What They Can Do

There are **four** roles. Three are org-scoped (`admin`, `manager`, `employee`) and live in `company_members`. The fourth is cross-tenant (`super_admin`) and lives in the separate `super_admins` table — a super admin is not a "member" of any one company.

| Role | Scope | Key Permissions |
|---|---|---|
| Super Admin | Cross-tenant (god mode) | Sees and acts on every company's data. Used for owner-level support, audits, cross-tenant analytics. |
| Admin | Org | Billing, settings, all managers, all departments, view every submission in the org |
| Manager | Org | SOPs, employees (invite/manage), announcements, monitors, submissions board — scoped to their own department, plus org-wide safety and quality alerts |
| Employee | Org | View SOPs (their departments), scan QR codes, view announcements, HR chat, submit reports |

**Submissions capability matrix** (Phase 2 feature, but the model is future-ready):

| Role | Can submit? | Can view / respond? |
|---|---|---|
| Super Admin | — | Everything across every tenant |
| Admin | — | Every submission in their own company |
| Manager | — | Their department's submissions + org-wide safety and quality alerts |
| Employee | ✅ | Their own submissions only |

Org-scoped role is stored in `company_members.role`. Super admin status is stored in `super_admins` (keyed by `clerk_user_id`) and resolved at query time via the `is_super_admin()` SQL helper. Check role on every Server Action / API route by looking up the relevant row for the current Clerk `userId` — never trust client-side role claims. Clerk is used for identity only.

---

## Languages (MVP)

MVP supports two languages only:

- `en` -- English (source language, always exists)
- `es` -- Spanish (translated, always flagged for re-review on English update)

Do not build generic multi-language infrastructure for MVP. Keep it simple and explicit. More languages come in Phase 2.

---

## Server Code Patterns

Every piece of server-side code — Server Components, Server Actions, and the small set of external API routes — follows the same spine:

1. Resolve company context via `getCompanyContext()` (throws typed errors on unauth / no-company / wrong-role).
2. Validate input with Zod *before* any Supabase call.
3. Run the query. RLS enforces tenancy; `.eq('company_id', company_id)` is defense in depth and index-friendly.
4. Return typed data, or the standard error envelope.

### `lib/auth/company-context.ts`

The Clerk + `company_members` lookup lives in exactly one place:

```typescript
import 'server-only';
import { auth } from '@clerk/nextjs/server';
import { getRequestClient } from '@/lib/supabase/server';

export type Role = 'admin' | 'manager' | 'employee';

export class AuthError extends Error {
  constructor(public code: 'UNAUTHENTICATED' | 'NO_COMPANY' | 'FORBIDDEN') {
    super(code);
  }
}

export async function getCompanyContext(required?: Exclude<Role, 'employee'>) {
  const { userId } = await auth();
  if (!userId) throw new AuthError('UNAUTHENTICATED');

  const supabase = await getRequestClient();
  const { data: member } = await supabase
    .from('company_members')
    .select('company_id, role')
    .eq('clerk_user_id', userId)
    .single();

  if (!member) throw new AuthError('NO_COMPANY');
  if (required && member.role !== 'admin' && member.role !== required) {
    throw new AuthError('FORBIDDEN');
  }
  return { userId, supabase, company_id: member.company_id, role: member.role as Role };
}
```

### Server Action (default for session-authed mutations)

```typescript
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCompanyContext, AuthError } from '@/lib/auth/company-context';

const CreateSopInput = z.object({
  title: z.string().min(1).max(200),
  template: z.enum(['step-by-step', 'reference', 'safety-checklist', 'onboarding']),
});

export async function createSop(input: unknown) {
  try {
    const { supabase, company_id } = await getCompanyContext('manager');
    const parsed = CreateSopInput.parse(input);

    const { data, error } = await supabase
      .from('sops')
      .insert({ ...parsed, company_id, status: 'draft' })
      .select()
      .single();
    if (error) return { ok: false as const, error: { code: 'INTERNAL', message: error.message } };

    revalidatePath('/dashboard/sops');
    return { ok: true as const, data };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false as const, error: { code: 'INVALID_INPUT', details: e.issues } };
    if (e instanceof AuthError) return { ok: false as const, error: { code: e.code } };
    throw e;
  }
}
```

### External API route (webhooks, monitor heartbeat, QR scan logging, cron)

```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCompanyContext, AuthError } from '@/lib/auth/company-context';

const Query = z.object({ status: z.enum(['draft', 'published']).optional() });

export async function GET(request: Request) {
  try {
    const { supabase, company_id } = await getCompanyContext();
    const parsed = Query.parse(Object.fromEntries(new URL(request.url).searchParams));

    let query = supabase.from('sops').select('*').eq('company_id', company_id);
    if (parsed.status) query = query.eq('status', parsed.status);

    const { data, error } = await query;
    if (error) return fail(500, 'INTERNAL', error.message);
    return NextResponse.json({ data });
  } catch (e) {
    if (e instanceof z.ZodError) return fail(400, 'INVALID_INPUT', undefined, e.issues);
    if (e instanceof AuthError) {
      if (e.code === 'UNAUTHENTICATED') return fail(401, 'UNAUTHENTICATED');
      return fail(403, e.code);
    }
    throw e;
  }
}

function fail(status: number, code: string, message?: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}
```

### Error envelope

Every failed response — Server Action or API route — uses this exact shape:

```typescript
{ error: { code: string, message?: string, details?: unknown } }
```

| Situation | HTTP (API) | Code |
|---|---|---|
| Zod parse failure | 400 | `INVALID_INPUT` |
| No Clerk session | 401 | `UNAUTHENTICATED` |
| Clerk session but no `company_members` row | 403 | `NO_COMPANY` |
| Session + company, wrong role | 403 | `FORBIDDEN` |
| Row not found (after company scoping) | 404 | `NOT_FOUND` |
| Supabase / Sonnet / Google error | 500 | `INTERNAL` |

Server Actions return `{ ok: false, error: { code, ... } }` instead of throwing so callers can discriminate in a typed way.

---

## SOP Conversion -- Sonnet Prompt Pattern

When calling Sonnet for SOP conversion, always:

1. Include the full company glossary in the system prompt
2. Ask for two outputs: (a) structured Markdown and (b) a JSON list of flagged site-specific terms
3. Use a structured output format so the response can be reliably parsed

**Why Sonnet and not Haiku:** This is the most critical step in the pipeline. Quality of the Markdown directly affects every translation and every employee experience. Sonnet produces better structured output, catches more nuanced site-specific terms, and the cost difference per SOP is negligible (pennies). Haiku is reserved for high-frequency lightweight tasks in Phase 2.

**Never use Claude for translation.** Google Cloud Translation API with glossary injection is purpose-built for this, significantly cheaper, and produces consistent results.

**System prompt contract** (owned by `lib/ai/sonnet.ts` — callers never rebuild this inline):

- Role: expert technical writer converting workplace SOPs to structured Markdown.
- Inject the full `glossary_terms` rows for the `company_id` as "already defined — use exactly as specified."
- Instructions: convert the document to clean Markdown (no HTML), preserving structure and warnings; flag any term that is site-specific, a proper noun, or would translate incorrectly via generic AI.
- Output shape, JSON only, no preamble: `{ "markdown": "...", "flagged_terms": [{ "term", "context", "reason", "suggested_definition_en", "suggested_term_es" }] }`.
- Model: `claude-sonnet-4-6`. `max_tokens: 4096`. Never Haiku for this step.

The prompt lives as a constant inside `lib/ai/sonnet.ts`; test it by snapshotting the rendered prompt for a fixture document + fixture glossary.

### AI call conventions (every Sonnet and Google Translate call)

- **Timeout: 60s hard** via `AbortController.signal` passed to the SDK. Timeout is a recoverable error surfaced to the manager, not a crash.
- **Retry: 1 retry on 429 / 5xx** with jittered backoff (500–1500ms). No retry on other 4xx — those indicate a prompt or input bug that won't fix itself.
- **Parse safety.** Wrap every `JSON.parse` in try/catch. On failure, log the raw response (first 2KB) and return `{ code: 'AI_PARSE_FAILURE', retry_allowed: true }` to the caller. Do **not** retry automatically — a second call will usually produce the same malformed output.
- **Cost logging.** After every Anthropic call, write one row to `ai_call_log`: `{ model, input_tokens, output_tokens, sop_id, company_id, duration_ms }`. This is the only early-warning signal for cost runaway before billing notices.
- **Never log full prompt or full response at INFO level.** Glossaries and SOP content are tenant-sensitive.

All Sonnet calls go through `lib/ai/sonnet.ts` (e.g. `convertSop({ documentText, glossary, signal })`), which encapsulates the timeout, retry, parse, and log steps. Callers never touch the Anthropic SDK directly — if a call site imports `@anthropic-ai/sdk`, that's a bug.

---

## Monitor Display

Follows DockClarity monitor display specifications:
- Minimum 1280x720, recommended 1920x1080, landscape only
- Fixed text sizes (do not scale with screen size)
- Dark theme default (black background)
- Auto-refresh built in
- Heartbeat indicator in footer
- Fullscreen toggle in footer
- Chrome/Edge kiosk mode for wall-mounted installs

MVP monitor shows placeholder content. Phase 2 will add named content modules.

---

## QR Print Layout

Follows DockClarity QR print system:
- 8.5x11 letter portrait, 0.25in margins
- Live preview using transform:scale on a 768x1008 container
- DotSlider component for size controls
- Sections: Logo + Company Name / Header / Sub-header / QR Size / Footer / Footer 2
- All sections collapsible (accordion pattern)
- Defaults: org logo if set, org phone number as Footer 2

---

## Environment Variables Required

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic (Sonnet for SOP conversion, Haiku reserved for Phase 2)
ANTHROPIC_API_KEY=

# Google Cloud Translation
GOOGLE_CLOUD_TRANSLATION_API_KEY=

# App
NEXT_PUBLIC_APP_URL=

# Monitor pairing cookie signer (any 32+ char random string)
MONITOR_COOKIE_SECRET=
```

---

## What Not to Build in MVP

If anyone (including me) asks for these during MVP, push back:

- Additional languages beyond English and Spanish
- Video recording, Loom integration, Scribe integration
- Voice search or voice translation
- Real-time chat beyond HR department
- OSHA PDF exports
- HRIS integrations
- Hardware accessories
- Per-user pricing tiers
- Advanced analytics beyond basic scan counts
- Multi-location corporate broadcast channels
- Peer recognition or social features

These are Phase 2. Scope creep kills MVPs.

---

## Accessibility Requirements

All UI must meet WCAG 2.1 AA from the start. This is non-negotiable. Warehouse-specific rules (glove-friendly taps, lighting, TV distance, bilingual `lang`) live in the `opsfluency-accessibility` skill.

- Minimum 44px touch targets on mobile
- Minimum 4.5:1 color contrast ratio for normal text
- Minimum 3:1 for large text and UI components
- All interactive elements keyboard accessible
- All images have meaningful alt text
- Focus indicators visible on all focusable elements
- No reliance on color alone to convey information

**Verification commands** (run before marking any UI task complete):

| Command | Purpose |
|---|---|
| `npx @axe-core/cli <preview-url>` | Automated a11y audit against a deployed route. Fail the task on any violation tagged `wcag2a` or `wcag2aa`. |
| `npx lighthouse <preview-url> --only-categories=accessibility --quiet` | Lighthouse a11y score; target ≥ 95. |

Automated checks catch ~40% of issues — the rest require the manual OpsFluency checks documented in the `opsfluency-accessibility` skill.

---

## Development Workflow

**Branching and PRs**

- One branch per task, named `claude/<task-slug>` (e.g. `claude/sop-import-pipeline`).
- Every change lands via a GitHub PR opened as **draft**. Ready-for-review only once typecheck + lint pass and the preview URL works.
- Commit messages follow **Conventional Commits**: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`. Keep subjects ≤72 chars and write the why, not the what.
- Squash-merge to `main`. Delete the branch on merge.
- Never force-push to `main`. Never skip hooks (`--no-verify`) without explicit approval.

**Deploy and verify**

- Vercel auto-deploys `main` to production and every branch to a preview URL.
- Primary dev surface is the Vercel preview URL on the PR. Local `npm run dev` is supported but rarely needed in Claude Code sessions.
- Before marking a task complete, run the relevant commands from `## Commands` (at minimum `npx tsc --noEmit` after any TypeScript change) and verify the preview URL if the change is user-facing. For UI changes, also run the two accessibility commands above.

**Lint and format**

- Linting is `next lint` via `npm run lint` (ESLint with the Next.js config). No Prettier config yet — revisit once the first real UI lands and a style disagreement actually exists.
- Do not introduce new lint rules mid-feature. If a rule needs to change, do it in its own `chore: update lint config` PR so diffs stay readable.

---

## Current Build Status

**Phase:** Pre-development. PRD complete. Ready to scaffold.

**Next steps:**
1. Initialize Next.js project with TypeScript, Tailwind, Clerk, Supabase
2. Seed default departments on org creation
3. Build SOP import pipeline (upload → Sonnet → flag → manager review → translate → publish)
4. Build manager dashboard (SOP list, create, glossary)
5. Build employee PWA (home, SOP viewer, QR scan)
6. Build monitor pairing and display
7. Build HR module (contacts, chat)
8. QR print system
