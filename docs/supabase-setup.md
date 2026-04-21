# Supabase setup

One-time setup steps for a fresh Supabase project. Do these in order —
the JWT validation step depends on the migration, and the migration
depends on the project existing.

## 1. Create the Supabase project

1. <https://supabase.com/dashboard> → **New project**.
2. Save the project URL, anon key, and service-role key into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## 2. Install the Supabase CLI

The CLI is how we apply migrations. It's installed outside `npm` so it
doesn't pollute the app's dependency tree.

```bash
# macOS
brew install supabase/tap/supabase

# Linux (Homebrew on Linux works too)
# or via: https://github.com/supabase/cli/releases
```

Verify:

```bash
supabase --version
```

## 3. Link and apply the first migration

From the repo root:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

`supabase/migrations/20260421000001_init.sql` lands:

- `companies`, `company_members`, `departments`, `ai_call_log`
- `requesting_company_id()` and `requesting_role()` helpers (read `auth.jwt() ->> 'sub'`)
- RLS policies on `companies`, `company_members`, `departments`
- `bootstrap_company()` RPC — service-role only

## 4. Configure Clerk as a third-party auth provider

This is the non-code step that makes RLS actually work. Without it,
`auth.jwt()` returns `null` and every RLS-gated query returns zero rows.

1. Supabase dashboard → **Authentication** → **Sign In / Providers** → **Third party auth**.
2. Add **Clerk** as a provider.
3. Paste the JWKS URL from Clerk. Find it in the Clerk dashboard under
   **API Keys** → **Show JWT public key** → the `.well-known/jwks.json`
   URL for your Clerk instance.
4. Save.

Verify by signing in as a test user and running a query against
`company_members` through a Server Component — you should see only your
own row even without a `.eq('company_id', ...)` filter.

## 5. Seed a test company (optional, dev only)

Once the migration is applied, bootstrap a company through the admin
client in a one-off script or Server Action. `bootstrapCompany()` in
`lib/auth/bootstrap-company.ts` is the canonical entry point.

```ts
import { bootstrapCompany } from "@/lib/auth/bootstrap-company";

await bootstrapCompany({
  name: "Acme Warehousing",
  phone: "+1-555-0100",
  adminClerkUserId: "user_abc123",
});
```

This creates the company, the admin `company_members` row, and the four
default departments (Safety, Equipment, Process, HR) in a single
transaction.
