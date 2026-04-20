# OpsFluency Codebase Audit

Date: 2026-04-20
Branch: `claude/audit-codebase-HhxE8`
Scope: full repository vs. `CLAUDE.md` specification.

## Summary

The repository is the unmodified `nextjs-clerk-starter` template (`package.json` name field). No OpsFluency product code exists yet. The build status in `CLAUDE.md` ("Pre-development. PRD complete. Ready to scaffold.") accurately reflects reality.

## What's present

- Next.js 16 + React 19 + Tailwind 4 + Clerk starter scaffold
- `proxy.ts` — Next 16's renamed middleware, wired to `clerkMiddleware()`
- Landing page (`app/page.tsx`), Clerk demo dashboard (`app/dashboard/page.tsx`), sign-in route, `/api/protected` stub
- `app/_template/` — marketing components shipped with the starter

## Dependency gaps vs. CLAUDE.md

Missing from `package.json`:

- `@supabase/supabase-js` — required for all data access
- `@anthropic-ai/sdk` — SOP conversion (Sonnet)
- `@google-cloud/translate` — translation with glossary injection
- `qrcode.react` — QR code generation
- `next-pwa` — worker offline/PWA support

## Environment variable gaps

`.env.example` only contains Clerk keys. Missing:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_CLOUD_TRANSLATION_API_KEY`
- `NEXT_PUBLIC_APP_URL`

## Directories not yet created

- `lib/auth/`, `lib/supabase/`, `lib/ai/`, `lib/translation/`, `lib/qr/`, `lib/types/`
- `components/sop/`, `components/monitor/`, `components/dashboard/`, `components/ui/`

## Routes not yet built

**Manager dashboard:** `sops`, `import`, `glossary`, `workers`, `announcements`, `departments`, `monitors`, `analytics`

**Worker PWA:** `/app/home`, `/app/sop/[id]`, `/app/scan`, `/app/hr`, `/app/search`

**Monitors:** `/monitor/[id]`, `/pair-monitor`

**API:** everything under `/api` except the `/protected` stub — `sops`, `import`, `glossary`, `translate`, `workers`, `announcements`, `monitors`, `analytics`, `hr`

## Data layer

No migrations, no schema, no typed Supabase helpers. None of the MVP tables exist: `companies`, `company_members`, `sops`, `sop_versions`, `qr_codes`, `glossary_terms`, `workers`, `worker_departments`, `sop_scans`, `announcements`, `monitors`, `hr_contacts`, `hr_chats`, `hr_chat_messages`.

## PWA

No `public/manifest.json`. No service worker config. `next-pwa` not installed.

## Direct conflicts with CLAUDE.md

1. **`app/components/user-details.tsx:3` imports `useOrganization` from Clerk.** CLAUDE.md states: *"Clerk is used for user identity and magic links only. The Organizations feature is not used."* Multi-tenancy must come from Supabase `company_members`. This starter component should be deleted or rewritten before anyone copies the pattern.
2. **`package.json` `name` is still `nextjs-clerk-starter`.** Should be `opsfluency`.
3. **`README.md` (7030 bytes) appears to duplicate `PRD.md` (same size)** rather than documenting setup.

## Minor observations

- `tsconfig.json` `target` is `ES2017`. Strict mode is on (good). Consider bumping to `ES2022` given Next 16 / React 19.
- No lint/format/test config beyond `next lint`. No CI workflow.
- `app/_template/` starter content is still referenced from `app/page.tsx` and `app/dashboard/page.tsx` — these will need removal when the real UI lands.

## Recommended next step

Start with step 1 from CLAUDE.md "Current Build Status":

1. Install Supabase, Anthropic, Google Translate, qrcode.react, next-pwa
2. Expand `.env.example` with all vars listed above
3. Create `lib/supabase/` client and `lib/auth/` helper that resolves `{ company_id, role }` via a `company_members` lookup keyed on Clerk `userId` — the pattern every API route will depend on
4. Write the initial Supabase migration for `companies` + `company_members` and seed the four default departments on company creation
5. Replace the `_template`/Clerk demo dashboard with the real manager shell

Getting (3) right first pays off: every subsequent API route reuses that helper.
