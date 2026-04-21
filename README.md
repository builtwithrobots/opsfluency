# OpsFluency

Frontline knowledge and engagement for multilingual warehouse and
manufacturing facilities. Bilingual SOP publishing, QR-triggered
learning, and departmental communication in one manager-driven system.

- **Product spec:** [`PRD.md`](./PRD.md)
- **Project memory:** [`CLAUDE.md`](./CLAUDE.md)
- **Active roadmap:** [`TODOS.md`](./TODOS.md)

---

## Quick start

```bash
nvm use                     # Node version pinned in .nvmrc
npm install
cp .env.example .env.local  # Fill in secrets — see the Environment section below
npm run dev
```

Local dev runs Next.js 16 with Turbopack on <http://localhost:3000>. In
practice, the Vercel preview URL on each PR is the primary dev surface
— local dev is only necessary for fast iteration on components that
don't need Supabase / Clerk / AI services.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server (Next 16 + Turbopack). |
| `npm run build` | Production build. |
| `npm run lint` | ESLint via `next lint`. |
| `npx tsc --noEmit` | Typecheck. Required after any non-trivial TypeScript change. |

See [`CLAUDE.md`](./CLAUDE.md#commands) for the full policy — failed
commands block task completion; `@ts-ignore` / `any` is not an
acceptable fix.

## Environment

Copy `.env.example` to `.env.local` and fill in the secrets. The full
list of required variables (Clerk, Supabase, Anthropic, Google Cloud
Translation, the monitor cookie signer, and the app URL) is documented
in [`CLAUDE.md`](./CLAUDE.md#environment-variables-required).

**Never commit `.env*` files.** `.gitignore` already excludes them.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router (TypeScript strict) |
| Styling | Tailwind CSS v4 |
| Auth | Clerk (user identity + magic links only — not Organizations) |
| Database | Supabase (PostgreSQL with Row Level Security) |
| Storage | Supabase Storage |
| AI | Claude Sonnet (SOP conversion + glossary flagging) |
| Translation | Google Cloud Translation with glossary injection |
| QR codes | `qrcode.react` |
| PWA | `next-pwa` |
| Validation | Zod at every server entry point |
| Deployment | Vercel (auto-deploy from GitHub) |

Architectural decisions — Clerk vs Supabase multi-tenancy, RLS, Server
Components default, the SOP status lifecycle — all live in
[`CLAUDE.md`](./CLAUDE.md).

## Contributing

1. Branch naming: `claude/<task-slug>`.
2. Commits follow **Conventional Commits** (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
3. Open PRs as **draft**. Mark ready-for-review once typecheck + lint
   pass and the Vercel preview URL works.
4. Squash-merge to `main`. Delete the branch on merge.

For UI changes, also run the accessibility verification commands
documented in [`CLAUDE.md`](./CLAUDE.md#accessibility-requirements).

## Status

**Phase:** Pre-development scaffolding.

See [`TODOS.md`](./TODOS.md) for the active 5-phase audit-closure plan
and which phase is currently in flight.

## License

See [`LICENSE.md`](./LICENSE.md).
