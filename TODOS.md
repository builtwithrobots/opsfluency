# TODOS — OpsFluency

> Living doc. Track pending work here so fresh sessions can pick up without re-auditing.
> Last updated: 2026-04-20 (+ SOP status lifecycle, Commands section, Server Components default, Development Workflow rewrite, package.json rename, tsconfig ES2022, PRD link)

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
- [ ] **Document the re-translation flag.** English edits must mark Spanish as stale. Proposal (_DECIDE:_): `needs_retranslation BOOLEAN NOT NULL DEFAULT FALSE` on `sop_versions`, cleared when manager re-approves Spanish.
- [ ] **Document the department-seeding mechanism.** "Seed 4 defaults on company creation" — where does the code live? Proposal (_DECIDE:_): run inside the company creation Server Action that fires on first sign-up, not a Postgres trigger (easier to test, visible in code).
- [ ] **Monitor + worker public route auth.** Neither is a logged-in human flow:
  - Monitor displays (_DECIDE:_): paired monitor emits a signed token stored in a cookie at pairing time; the `/monitor/[id]` route validates the token server-side.
  - QR scan landing (_DECIDE:_): scan lands on `/s/[qr_code_id]` which is public and redirects to `/app/sop/[id]` requiring a worker magic-link session. If unauthenticated, redirect to sign-in and preserve the intended SOP.

### Missing conventions that will cause drift

- [x] **Server Components vs `"use client"` default.** New "Default to Server Components" subsection in `CLAUDE.md` under Key Architectural Decisions. Lists the exact opt-in triggers (React hooks, browser APIs, interactive event handlers, third-party dependents) and requires pushing interactive subtrees into small `*Client.tsx` children when the parent doesn't itself need the client runtime.
- [x] **Data fetching pattern.** Picked: Server Components read Supabase directly via `getRequestClient(userId)`; session-authed mutations are Server Actions; `/api` is strictly reserved for external/non-session callers (webhooks, monitor heartbeat, QR scan logging, cron). Documented in a new "Data fetching" subsection under Key Architectural Decisions in `CLAUDE.md`.
- [ ] **Supabase Storage buckets.** Name them and document signed URL TTLs:
  - `sop-uploads` — original docs, private, signed URLs (1h) for manager review
  - `company-logos` — public bucket, logos for QR print headers
- [ ] **QR URL shape.** Proposal (_DECIDE:_): `${NEXT_PUBLIC_APP_URL}/s/[qr_code_id]`. The `qr_code_id` is the `qr_codes.id` (UUID), permanent, never the `sop_id`. Archive returns a friendly 410 page, not a 404.
- [x] **AI call conventions.** New "AI call conventions" subsection under the Sonnet section in `CLAUDE.md`. Covers 60s hard timeout via `AbortController`, 1 retry on 429/5xx with jittered backoff (500–1500ms), `JSON.parse` wrapped in try/catch returning `AI_PARSE_FAILURE` with no auto-retry, `ai_call_log` row for every Anthropic call (`model`, `input_tokens`, `output_tokens`, `sop_id`, `company_id`, `duration_ms`), and a rule that all Sonnet calls go through `lib/ai/sonnet.ts` rather than the Anthropic SDK directly.

### Remove / reconcile existing lines

- [x] **Delete** "Always increment version comment in file header (vX.X.X)." Removed from the Development Workflow section in `CLAUDE.md`.
- [x] **Reconcile** "No local dev environment." Rewritten to: Vercel preview URL is the primary dev surface; `npm run dev` is supported but rarely needed in Claude Code sessions. All changes go through a `claude/*` branch + PR.
- [x] **Soften or back up** "Never break existing functionality." Replaced with a concrete verification rule: run the relevant `## Commands` (at minimum `npx tsc --noEmit` after any TS change) and verify the preview URL if the change is user-facing.

### Starter residue to remove (add a new section in CLAUDE.md)

- [x] `package.json` name renamed from `nextjs-clerk-starter` to `opsfluency`.
- [ ] `app/components/user-details.tsx` imports Clerk `useOrganization` — conflicts with the "no Organizations" rule. Delete the component (nothing real uses it once the dashboard is rebuilt).
- [ ] `app/_template/` contains the starter marketing content and is referenced from `app/page.tsx` and `app/dashboard/page.tsx`. Remove when the real manager shell lands.
- [ ] `README.md` (7030 bytes) appears to duplicate `PRD.md`. Replace with a real setup/overview.
- [x] `tsconfig.json` `target` bumped from `ES2017` to `ES2022` for Next 16 / React 19. (Pre-existing typecheck errors in `app/_template/` image imports are unrelated and tracked by the starter-residue cleanup items above.)

### Nice-to-haves for CLAUDE.md

- [x] Link `PRD.md` explicitly (`./PRD.md`) where schema details are cited. Updated in the "Supabase Tables (MVP)" section of `CLAUDE.md`.
- [ ] Add `## Git Workflow`: branch naming (`claude/<task>-<slug>`), Conventional Commits, Vercel preview URL per PR.
- [ ] Add concrete accessibility testing commands (axe CLI, Lighthouse CI) rather than only stating the rules.
- [ ] Note Prettier/ESLint config once chosen.

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

## Reference

- Audit: `./AUDIT.md`
- Project memory: `./CLAUDE.md`
- Product spec: `./PRD.md`
- Draft PR: https://github.com/VibeIQ/opsfluency/pull/1
