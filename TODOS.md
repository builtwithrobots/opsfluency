# TODOS — OpsFluency

> Living doc. Track pending work here so fresh sessions can pick up without re-auditing.
> Last updated: 2026-04-20 (auth() await + proxy.ts documentation landed)

---

## Top of queue: CLAUDE.md improvements

The codebase audit surfaced gaps in `CLAUDE.md` that will cause incorrect code generation in future sessions. Fix these **before** scaffolding real product code — every subsequent task reads CLAUDE.md first.

### Correctness fixes (highest priority — will cause runtime bugs)

- [x] **Fix `auth()` calls to be `await`ed.** `@clerk/nextjs ^7.2.2` is installed and `auth()` is async in v7. Both snippets updated in `CLAUDE.md` (lines ~127 and ~280).
- [x] **Document `proxy.ts`, not `middleware.ts`.** Added to the Project Structure tree plus an "Auth proxy (`proxy.ts`)" subsection enumerating the public routes (`/sign-in`, `/sign-up`, `/monitor/[id]`, `/pair-monitor`, `/s/[qr_code_id]`).
- [ ] **Specify the Supabase client split.** The examples use a bare `supabase` with no import. Document:
  - `lib/supabase/server.ts` — service-role client, server-only
  - `lib/supabase/anon.ts` — anon client, safe for browser
  - Hard rule: `SUPABASE_SERVICE_ROLE_KEY` never imported from client code. Add a comment on the import.
- [ ] **State the RLS position explicitly.** Either "RLS on every company-scoped table + a `requesting_company_id()` helper" **or** "MVP relies on server-side `company_id` filtering via service-role client; RLS deferred to Phase 2." Pick one and justify it.

### Missing operational info Claude needs to verify work

- [ ] **Add a `## Commands` section** with exact invocations:
  - `npm run dev` — local dev (Turbopack)
  - `npm run build` — production build
  - `npm run lint` — ESLint
  - `npx tsc --noEmit` — typecheck (verify code compiles)
  - `npm test` — (once a test runner is picked; see below)
- [ ] **Pick a validation library** (recommend Zod) and add a canonical API route example showing:
  - 400 on schema parse failure
  - 401 unauthorized
  - 403 wrong company / insufficient role
  - 404 not found
  - 500 Supabase error
- [ ] **Enumerate the SOP status lifecycle.** Currently "status lifecycle" is referenced but values aren't listed. Proposal (_DECIDE:_ confirm vs PRD §6): `draft → pending_terms → pending_translation → pending_approval → published → archived`.
- [ ] **Document the re-translation flag.** English edits must mark Spanish as stale. Proposal (_DECIDE:_): `needs_retranslation BOOLEAN NOT NULL DEFAULT FALSE` on `sop_versions`, cleared when manager re-approves Spanish.
- [ ] **Document the department-seeding mechanism.** "Seed 4 defaults on company creation" — where does the code live? Proposal (_DECIDE:_): run inside the company creation Server Action that fires on first sign-up, not a Postgres trigger (easier to test, visible in code).
- [ ] **Monitor + worker public route auth.** Neither is a logged-in human flow:
  - Monitor displays (_DECIDE:_): paired monitor emits a signed token stored in a cookie at pairing time; the `/monitor/[id]` route validates the token server-side.
  - QR scan landing (_DECIDE:_): scan lands on `/s/[qr_code_id]` which is public and redirects to `/app/sop/[id]` requiring a worker magic-link session. If unauthenticated, redirect to sign-in and preserve the intended SOP.

### Missing conventions that will cause drift

- [ ] **Server Components vs `"use client"` default.** Add: "Default to Server Components. Add `"use client"` only when hooks, browser APIs, or interactive state are required."
- [ ] **Data fetching pattern.** Proposal (_DECIDE:_): Server Components call Supabase directly via `lib/supabase/server`; mutations use Server Actions; `/api` routes are only for external callers (monitor heartbeat, QR scan logging, webhooks).
- [ ] **Supabase Storage buckets.** Name them and document signed URL TTLs:
  - `sop-uploads` — original docs, private, signed URLs (1h) for manager review
  - `company-logos` — public bucket, logos for QR print headers
- [ ] **QR URL shape.** Proposal (_DECIDE:_): `${NEXT_PUBLIC_APP_URL}/s/[qr_code_id]`. The `qr_code_id` is the `qr_codes.id` (UUID), permanent, never the `sop_id`. Archive returns a friendly 410 page, not a 404.
- [ ] **AI call conventions.** Add to the Sonnet section:
  - Timeout: 60s hard, AbortController
  - Retry: 1 retry on 429/5xx with jittered backoff
  - Parse safety: try/catch JSON.parse; on failure, log the raw response and return a recoverable error to the manager
  - Cost guardrail: log `usage.input_tokens` + `usage.output_tokens` for every conversion

### Remove / reconcile existing lines

- [ ] **Delete** "Always increment version comment in file header (vX.X.X)." Per-file semver drifts and adds noise with no enforcement.
- [ ] **Reconcile** "No local dev environment. All development through Claude Code." `npm run dev` exists; pick wording like "Primary dev surface is Vercel preview deployments. Local `next dev` is supported but not required."
- [ ] **Soften or back up** "Never break existing functionality." Either:
  - Add Vitest + Playwright to the tech stack + `## Commands`, or
  - Replace with "verify changes via the Vercel preview URL on the PR before merging."

### Starter residue to remove (add a new section in CLAUDE.md)

- [ ] `package.json` name is still `nextjs-clerk-starter` → rename to `opsfluency`
- [ ] `app/components/user-details.tsx` imports Clerk `useOrganization` — conflicts with the "no Organizations" rule. Delete the component (nothing real uses it once the dashboard is rebuilt).
- [ ] `app/_template/` contains the starter marketing content and is referenced from `app/page.tsx` and `app/dashboard/page.tsx`. Remove when the real manager shell lands.
- [ ] `README.md` (7030 bytes) appears to duplicate `PRD.md`. Replace with a real setup/overview.
- [ ] `tsconfig.json` `target` is `ES2017`. Bump to `ES2022` for Next 16 / React 19.

### Nice-to-haves for CLAUDE.md

- [ ] Link `PRD.md` explicitly (`./PRD.md`) where schema details are cited.
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
