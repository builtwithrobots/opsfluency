# TODOS — OpsFluency

> Living doc. Track pending work here so fresh sessions can pick up without re-auditing.
> Last updated: 2026-04-21 (Phase 1 closed: docs, skills, DECIDE items, tokenization pass)

---

## Phase plan (audit closure)

Five-phase plan, one PR each, stacked on `main`. See branch `claude/audit-codebase-guidelines-oump0` and descendants.

| Phase | Branch | Status |
|---|---|---|
| 1. Docs & skills cleanup + tokenization | `claude/audit-codebase-guidelines-oump0` | **Shipped** (PR #11) |
| 2. Starter residue removal | `claude/audit-codebase-guidelines-oump0` | **Shipped** (PR #11) |
| 3. Dependencies & env vars | `claude/audit-codebase-guidelines-oump0` | **Shipped** (PR #11) |
| 4. `lib/` scaffolding (supabase, auth, types, ai) | `claude/audit-codebase-guidelines-oump0` | **Shipped** (PR #11) |
| 5. First migration (companies, company_members, RLS, default depts) | `claude/audit-codebase-guidelines-oump0` | **In progress** (this PR) |

Phase 6+ (real product build) begins after Phase 5.

**Audit closure complete at the end of Phase 5.**

---

## Top of queue: CLAUDE.md improvements

The codebase audit surfaced gaps in `CLAUDE.md` that will cause incorrect code generation in future sessions. Fix these **before** scaffolding real product code — every subsequent task reads CLAUDE.md first.

### Correctness fixes (highest priority — will cause runtime bugs)

- [x] **Fix `auth()` calls to be `await`ed.** `@clerk/nextjs ^7.2.2` is installed and `auth()` is async in v7. Both snippets updated in `CLAUDE.md` (lines ~127 and ~280).
- [x] **Document `proxy.ts`, not `middleware.ts`.** Added to the Project Structure tree plus an "Auth proxy (`proxy.ts`)" subsection enumerating the public routes (`/sign-in`, `/sign-up`, `/monitor/[id]`, `/pair-monitor`, `/s/[qr_code_id]`).
- [x] **Specify the Supabase client split.** Added a "Supabase clients" subsection to `CLAUDE.md` covering three clients: `lib/supabase/server.ts` (request-scoped authenticated, RLS enforced), `lib/supabase/admin.ts` (service-role, server-only, bypasses RLS with justification required at each import site), `lib/supabase/browser.ts` (anon, `"use client"` only). Both API-route code snippets updated to import `getRequestClient` from `@/lib/supabase/server`.
- [x] **State the RLS position explicitly.** Picked option (a): RLS enabled on every company-scoped table from day one, backed by a `requesting_company_id()` SQL helper that reads `request.clerk_user_id` from the Postgres session. New "Row Level Security (RLS)" subsection in `CLAUDE.md` documents the decision, the policy pattern, and the rule that every new company-scoped table ships with RLS + a `<table>_company_isolation` policy in the same migration.

### Missing operational info Claude needs to verify work

- [x] **Add a `## Commands` section.** Added right after Tech Stack in `CLAUDE.md` with `npm run dev` / `npm run build` / `npm run lint` / `npx tsc --noEmit`. Noted that `npx tsc --noEmit` is required after any non-trivial TypeScript change and that `@ts-ignore` / `any` are not acceptable suppressions. `npm test` deferred until a test runner is picked.
- [x] **Pick a validation library + canonical API route example.** Zod added to the tech stack. `CLAUDE.md` now has a "Server Code Patterns" section with a shared `lib/auth/company-context.ts` helper (`AuthError` with `UNAUTHENTICATED` / `NO_COMPANY` / `FORBIDDEN`), plus a canonical Server Action and a canonical external API route — both Zod-validated. Error envelope `{ error: { code, message?, details? } }` is documented with a status-code table (400 `INVALID_INPUT`, 401 `UNAUTHENTICATED`, 403 `NO_COMPANY` / `FORBIDDEN`, 404 `NOT_FOUND`, 500 `INTERNAL`).
- [x] **Enumerate the SOP status lifecycle.** Picked the proposal: `draft → pending_terms → pending_translation → pending_approval → published → archived`. New "SOP status lifecycle" subsection in `CLAUDE.md` spells out each transition, the `CHECK` constraint + `lib/types/sop.ts` rule, that transitions are guarded by reading the current status in the same Server Action transaction, that `archived` is terminal, and that English edits create a new `sop_versions` row + set `needs_retranslation = true` without flipping `sops.status`.
- [x] **Document the re-translation flag.** `sop_versions.needs_retranslation BOOLEAN NOT NULL DEFAULT FALSE`, set on English edit, cleared on re-approval. Documented in `CLAUDE.md` → "SOP status lifecycle".
- [x] **Document the department-seeding mechanism.** Server Action on company creation (not Postgres trigger). Idempotent via `ON CONFLICT DO NOTHING`. Documented in `CLAUDE.md` → "Departments".
- [x] **Monitor + worker public route auth.** Documented in `CLAUDE.md` → "Auth proxy":
  - Monitor: signed HttpOnly `opsf_monitor` cookie issued at pairing, signed with `MONITOR_COOKIE_SECRET`, validated on every `/monitor/[id]` request.
  - QR scan: `/s/[qr_code_id]` is public, resolves to current `published` SOP, redirects through sign-in while preserving SOP id if no worker session.

### Missing conventions that will cause drift

- [x] **Server Components vs `"use client"` default.** New "Default to Server Components" subsection in `CLAUDE.md` under Key Architectural Decisions. Lists the exact opt-in triggers (React hooks, browser APIs, interactive event handlers, third-party dependents) and requires pushing interactive subtrees into small `*Client.tsx` children when the parent doesn't itself need the client runtime.
- [x] **Data fetching pattern.** Picked: Server Components read Supabase directly via `getRequestClient(userId)`; session-authed mutations are Server Actions; `/api` is strictly reserved for external/non-session callers (webhooks, monitor heartbeat, QR scan logging, cron). Documented in a new "Data fetching" subsection under Key Architectural Decisions in `CLAUDE.md`.
- [x] **Supabase Storage buckets.** `sop-uploads` (private, 1h signed URLs, path `${company_id}/${sop_id}/${filename}`) + `company-logos` (public). Documented in `CLAUDE.md` → "Supabase Storage buckets".
- [x] **QR URL shape.** `${NEXT_PUBLIC_APP_URL}/s/<qr_codes.id>`, permanent, never `sop_id`. Archive returns 410 with a friendly page. Documented in `CLAUDE.md` → "QR Codes are Permanent".
- [x] **AI call conventions.** New "AI call conventions" subsection under the Sonnet section in `CLAUDE.md`. Covers 60s hard timeout via `AbortController`, 1 retry on 429/5xx with jittered backoff (500–1500ms), `JSON.parse` wrapped in try/catch returning `AI_PARSE_FAILURE` with no auto-retry, `ai_call_log` row for every Anthropic call (`model`, `input_tokens`, `output_tokens`, `sop_id`, `company_id`, `duration_ms`), and a rule that all Sonnet calls go through `lib/ai/sonnet.ts` rather than the Anthropic SDK directly.

### Remove / reconcile existing lines

- [x] **Delete** "Always increment version comment in file header (vX.X.X)." Removed from the Development Workflow section in `CLAUDE.md`.
- [x] **Reconcile** "No local dev environment." Rewritten to: Vercel preview URL is the primary dev surface; `npm run dev` is supported but rarely needed in Claude Code sessions. All changes go through a `claude/*` branch + PR.
- [x] **Soften or back up** "Never break existing functionality." Replaced with a concrete verification rule: run the relevant `## Commands` (at minimum `npx tsc --noEmit` after any TS change) and verify the preview URL if the change is user-facing.

### Starter residue to remove (add a new section in CLAUDE.md)

- [x] `package.json` name renamed from `nextjs-clerk-starter` to `opsfluency`.
- [x] `app/components/user-details.tsx` deleted along with `code-switcher.tsx` and `theme.ts` (Phase 2).
- [x] `app/_template/` directory removed; `app/page.tsx` and `app/dashboard/page.tsx` rewritten as minimal placeholders that use the Steel & Signal design tokens from `globals.css` (Phase 2).
- [x] `README.md` rewritten as real setup / overview docs pointing to `CLAUDE.md`, `PRD.md`, and `TODOS.md` (Phase 2).
- [x] `app/layout.tsx` switched from `next/font/local` (Geist) to `next/font/google` (Chakra Petch / Inter / JetBrains Mono) — matches the contract in `globals.css`. Dropped the prism CDN scripts and `@clerk/ui` import (Phase 2).
- [x] `app/api/protected/route.ts` stub deleted (Phase 2).
- [x] `tsconfig.json` `target` bumped from `ES2017` to `ES2022` for Next 16 / React 19.

### Nice-to-haves for CLAUDE.md

- [x] Link `PRD.md` explicitly (`./PRD.md`) where schema details are cited. Updated in the "Supabase Tables (MVP)" section of `CLAUDE.md`.
- [x] Git workflow documented in-line in the expanded `## Development Workflow` section: branch naming, Conventional Commits, draft PRs, squash-merge, preview URL.
- [x] Accessibility testing commands (axe CLI + Lighthouse) added to `## Accessibility Requirements`.
- [x] Lint/format note added — ESLint via `next lint` is the current config; Prettier deferred until a real style disagreement exists.

---

## After CLAUDE.md is updated: scaffolding work

Listed here for continuity — do **not** start until CLAUDE.md is fixed, because decisions above shape the code.

1. **Install missing deps:** `@supabase/supabase-js`, `@anthropic-ai/sdk`, `@google-cloud/translate`, `qrcode.react`, `next-pwa`, `zod`.
2. **Expand `.env.example`** with all vars currently listed in `CLAUDE.md` "Environment Variables Required."
3. **Create `lib/supabase/server.ts` and `lib/supabase/anon.ts`** per the client-split decision.
4. **Create `lib/auth/company-context.ts`** exporting `getCompanyContext()` that returns `{ userId, company_id, role }` or throws a typed error. Every API route + Server Component uses this.
5. **First migration:** `companies`, `company_members`, and the default-department seed logic.
6. **Replace the starter dashboard/landing** with real manager shell.
7. **SOP import pipeline** in the 10-step order from CLAUDE.md.
8. **Worker PWA** (`/app/home`, `/app/sop/[id]`, `/app/scan`, `/app/search`, `/app/hr`).
9. **Monitor pairing + display.**
10. **QR print layout.**
11. **HR module** (contacts + chat).

---

## Phase 5 completion notes (2026-04-21)

**Decision:** JWT-claim RLS (Option A). Clerk is configured in the Supabase dashboard as a third-party auth provider; RLS reads caller identity from `auth.jwt() ->> 'sub'`.

**What landed**

- `CLAUDE.md` → Row Level Security section updated: `requesting_company_id()` helper now reads `auth.jwt() ->> 'sub'` instead of `current_setting('request.clerk_user_id', true)`. Supabase clients section updated to reflect the Bearer-JWT flow.
- `lib/supabase/server.ts` simplified: `getRequestClient()` (no param) returns a client with the Clerk JWT as the Bearer token. `x-clerk-user-id` header removed — one auth signal, not two.
- `lib/auth/company-context.ts` updated for the new signature.
- **`supabase/migrations/20260421000001_init.sql`** — the first migration:
  - Tables: `companies`, `company_members`, `departments`, `ai_call_log`
  - Helpers: `requesting_company_id()`, `requesting_role()` (both read `auth.jwt() ->> 'sub'`)
  - RLS: `companies_self_read`, `company_members_self_read`, `departments_company_isolation` — `ai_call_log` is service-role only (REVOKE from anon/authenticated)
  - `bootstrap_company(name, phone, logo_url, admin_clerk_user_id)` RPC — `security definer`, REVOKE'd from anon/authenticated, runs the company + admin member + 4 default department inserts in one transaction
- `lib/auth/bootstrap-company.ts` — typed TS wrapper for the `bootstrap_company` RPC. Uses the admin client because signup runs before the caller has a `company_members` row.
- `docs/supabase-setup.md` — one-time setup: project creation, Supabase CLI install, `supabase db push`, and (most importantly) the **Clerk third-party auth provider** dashboard step that makes the JWT flow work.

**Verification**

- `npx tsc --noEmit` — clean
- `npm run lint` — clean (0 problems)
- `npm run build` — success, 5 routes generated

**Audit closure — DONE.** The repo now has:
- A documented architecture in `CLAUDE.md` with no open `_DECIDE:_` items
- Skills aligned with the spec
- No starter residue
- All product deps installed, ESLint wired, env vars documented
- `lib/` scaffolding for every future Server Component / Server Action / API route
- First Supabase migration with RLS baked in from day one

Phase 6+ (real product build: SOP import pipeline, manager shell, worker PWA, monitors, HR) begins next and should be scoped as its own multi-PR plan.

---

## Phase 4 completion notes (2026-04-21)

**What landed**

- `lib/supabase/server.ts` — `getRequestClient(clerkUserId)` for Server Components, Server Actions, and API routes. Attaches the Clerk JWT as Bearer and sets `x-clerk-user-id` as a second signal that Phase 5's PostgREST pre-request hook can translate into the `request.clerk_user_id` GUC used by the `requesting_company_id()` RLS helper.
- `lib/supabase/admin.ts` — service-role singleton factory with `import 'server-only'`; documented as RLS-bypass.
- `lib/supabase/browser.ts` — anon singleton factory for `"use client"` components.
- `lib/types/sop.ts` — `SopStatus` / `SopTemplate` unions, `ALLOWED_SOP_TRANSITIONS` + `canTransitionSop(from, to)`, `SOP_UPLOAD_MIME_TYPES`, `SOP_UPLOAD_MAX_BYTES`, `SOP_UPLOADS_BUCKET`. Every call site imports from here instead of hardcoding.
- `lib/auth/company-context.ts` — `getCompanyContext(required?)` returning `{ userId, supabase, company_id, role }` or throwing a typed `AuthError` (`UNAUTHENTICATED` / `NO_COMPANY` / `FORBIDDEN`). Matches `CLAUDE.md` → "Server Code Patterns" exactly.
- `lib/ai/sonnet.ts` — `callSonnet<T>(input, ctx)` wrapper with 60s timeout, 1 retry on 429/5xx with jittered backoff (500–1500ms), parse step with raw-preview capture on failure, and a best-effort `ai_call_log` insert via the admin client. No call site should import `@anthropic-ai/sdk` directly.
- `proxy.ts` — `createRouteMatcher(['/dashboard(.*)', '/app(.*)'])` protects dashboard + worker PWA routes. `/sign-in`, `/sign-up`, `/monitor/[id]`, `/pair-monitor`, `/s/[qr_code_id]` are public by default.

**Verification**

- `npx tsc --noEmit` — clean
- `npm run lint` — clean (0 problems)
- `npm run build` — success, 5 routes generated, proxy middleware compiled

**Notes for Phase 5**

- The `requesting_company_id()` helper in the first migration should read `current_setting('request.clerk_user_id', true)`. The migration also needs a PostgREST-compatible pre-request function that reads the `x-clerk-user-id` header set by `getRequestClient` and calls `SET LOCAL request.clerk_user_id = ...`. If that's too much moving parts, the alternative is to update the helper to read `auth.jwt() ->> 'sub'` from Clerk's Bearer token — both paths are compatible with the Phase 4 client code.
- `ai_call_log` table schema (minimum columns, matches `CLAUDE.md` → "AI call conventions"): `id UUID`, `model TEXT`, `input_tokens INT`, `output_tokens INT`, `sop_id UUID NULL`, `company_id UUID`, `duration_ms INT`, `created_at TIMESTAMPTZ DEFAULT NOW()`. Keep RLS disabled — this table is service-role only.
- `lib/ai/sonnet.ts` defaults to `claude-sonnet-4-6` (latest Sonnet per the Anthropic model catalog).

---

## Phase 3 completion notes (2026-04-21)

**What landed**

- Removed unused starter deps: `@clerk/ui`, `react-syntax-highlighter`, `prism-react-renderer`, `@types/react-syntax-highlighter`, `@types/next-pwa`.
- Installed product deps (runtime): `@supabase/supabase-js`, `@anthropic-ai/sdk`, `@google-cloud/translate`, `qrcode.react`, `next-pwa`.
- Installed ESLint (Next 16 flat-config compatible): `eslint`, `eslint-config-next@16.2.4`, `@eslint/eslintrc` as devDependencies. Created `eslint.config.mjs` that imports `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript` directly (the `FlatCompat`-based approach hits a circular-structure bug with ESLint 9).
- Updated `package.json` scripts: `"lint": "eslint"`, new `"lint:fix": "eslint --fix"`, new `"typecheck": "tsc --noEmit"`.
- Expanded `.env.example` with section comments and all vars from `CLAUDE.md` → "Environment Variables Required": Clerk, Supabase (anon + service role), Anthropic, Google Cloud Translation, `NEXT_PUBLIC_APP_URL`, and `MONITOR_COOKIE_SECRET`.
- Fixed a `react/no-unescaped-entities` lint error in `app/dashboard/page.tsx` surfaced by the new lint config.

**Verification**

- `npx tsc --noEmit` — clean
- `npm run lint` — clean (0 problems)
- `npm run build` — success, 5 routes generated (`/`, `/_not-found`, `/dashboard`, `/sign-in/[[...sign-in]]`, plus the proxy)

**Known `next-pwa` vulnerability**

`npm audit` reports 5 high-severity advisories in `next-pwa`'s build-time dependency chain (`workbox-build` → `rollup-plugin-terser` → `serialize-javascript`). These are build-time tools, not runtime-exploitable. `next-pwa` itself is lightly maintained. Consider switching to `@ducanh2912/next-pwa` (active fork) or `@serwist/next` when PWA wiring actually lands in a later phase. Any switch is a `CLAUDE.md` spec change — not a Phase 3 decision.

---

## Phase 2 completion notes (2026-04-21)

**What landed**

- Deleted `app/_template/` (marketing starter content), `app/components/` (starter user-details / code-switcher / theme), `app/api/protected/` stub, and `app/fonts/` (Geist local fonts).
- Rewrote `app/layout.tsx` with real metadata, `next/font/google` matching the `globals.css` contract (Chakra Petch / Inter / JetBrains Mono), WCAG skip link, and a plain `ClerkProvider` (dropped starter's `@clerk/ui` import and custom appearance).
- Rewrote `app/page.tsx` and `app/dashboard/page.tsx` as minimal placeholders using the Steel & Signal design tokens already defined in `globals.css`. Dashboard keeps `auth.protect()` so Clerk redirects unauthenticated users.
- Rewrote `README.md` as a real setup + contributor guide (previously a byte-for-byte copy of `PRD.md`).

**Known follow-ups discovered in Phase 2 (pushed to Phase 3)**

- `next lint` was removed in Next 16 — `npm run lint` currently fails with "Invalid project directory provided". Phase 3 will install ESLint + `eslint-config-next` directly and update the script.
- `@clerk/ui` is still listed as a dependency in `package.json` but no longer imported anywhere. Remove in Phase 3.

---

## Phase 1 completion notes (2026-04-21)

**What landed in this phase**

- New `## Skills` section in `CLAUDE.md` with precedence rule (`CLAUDE.md` wins over any skill).
- All remaining `_DECIDE:_` items closed (re-translation flag, dept seeding, monitor auth, QR auth, storage buckets, QR URL shape, git workflow, a11y commands, lint note).
- `opsfluency-sop-pipeline` SKILL.md aligned with `CLAUDE.md`'s 6-state lifecycle; removed bogus `active`/`expired` states and `translation_status` field; updated QR/version/storage rules.
- Tokenization pass: shortened the three OpsFluency skill descriptions (~225 → ~85 words combined); trimmed the Sonnet prompt code block in `CLAUDE.md` (~30 lines → ~10); deleted four redundant general-purpose skills (`frontend-ui-ux`, `ui-ux-pro-max`, `web-design-guidelines`, `web-quality-skills`).
- `MONITOR_COOKIE_SECRET` added to the env vars list.

**Baseline token budget**

Per-turn fixed cost is now roughly:
- `CLAUDE.md` full content: ~7.5K tokens (further trim possible in Phase 4 once `lib/` files exist and can replace the inline examples).
- Skill descriptions (10 skills): ~1K tokens.
- **Total baseline: ~8.5K tokens per turn**, down from ~10K.

Further token savings deferred to Phase 4 — the big remaining block is the inline `getCompanyContext`, Server Action, and API route code examples (~120 lines combined), which become redundant once the real files exist.

---

## Reference

- Audit: `./AUDIT.md`
- Project memory: `./CLAUDE.md`
- Product spec: `./PRD.md`
- Draft PR: https://github.com/VibeIQ/opsfluency/pull/1
