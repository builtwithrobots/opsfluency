# TODOS — OpsFluency

> Living doc. Track pending work here so fresh sessions can pick up without re-auditing.
> Last updated: 2026-04-21 (Phase 1 closed: docs, skills, DECIDE items, tokenization pass)

---

## Phase plan (audit closure)

Five-phase plan, one PR each, stacked on `main`. See branch `claude/audit-codebase-guidelines-oump0` and descendants.

| Phase | Branch | Status |
|---|---|---|
| 1. Docs & skills cleanup + tokenization | `claude/audit-codebase-guidelines-oump0` | **Shipped** (PR #11) |
| 2. Starter residue removal | `claude/audit-codebase-guidelines-oump0` | **In progress** (this PR) |
| 3. Dependencies & env vars | TBD | Pending |
| 4. `lib/` scaffolding (supabase, auth, types, ai) | TBD | Pending |
| 5. First migration (companies, company_members, RLS, default depts) | TBD | Pending |

Phase 6+ (real product build) begins after Phase 5.

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
