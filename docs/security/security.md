# OpsFluency — Security State

> Living document. Update this file whenever a security-relevant change lands.
> Last updated: 2026-05-01
> Branch: `claude/improve-employee-invitations-Nf7IQ`

---

## Active Security Controls

| Layer | Control | Implementation | Status |
|---|---|---|---|
| **Transport** | HTTPS-only (Vercel enforces TLS 1.2+) | Vercel platform | ✅ Active |
| **Transport** | HTTP security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) | `next.config.ts` | ✅ Added 2026-04-29 |
| **Authentication** | All `/dashboard/*` and `/app/*` routes require a valid Clerk session | `proxy.ts` → `clerkMiddleware()` | ✅ Active |
| **Authentication** | Employees authenticate via magic link only — no passwords | Clerk config | ✅ Active |
| **Authentication** | Clerk Organizations feature is NOT used — no org-confusion attack surface | Architecture decision | ✅ Active |
| **Authorization** | Every Server Action and API route starts with `getCompanyContext(role?)` before any DB call | `lib/auth/company-context.ts` | ✅ Active |
| **Authorization** | Role enforcement (admin / manager / employee) is server-side only; client claims never trusted | `lib/auth/company-context.ts` | ✅ Active |
| **Authorization** | Super admins verified via `is_super_admin()` SQL RPC on every request; revocation is immediate | `lib/auth/super-admin-context.ts` + `supabase/migrations/20260421000003_role_model_v2.sql` | ✅ Active |
| **Multi-tenant isolation** | Row Level Security enabled on every company-scoped table | All migrations | ✅ Active |
| **Multi-tenant isolation** | `requesting_company_id()` is SECURITY DEFINER; reads `auth.jwt() ->> 'sub'` from Clerk JWT; Supabase trusts Clerk as third-party auth provider | `supabase/migrations/20260421000001_init.sql` + `20260421000002_fix_rls_helpers.sql` | ✅ Active |
| **Multi-tenant isolation** | Every tenant policy includes `OR is_super_admin()` so internal support tooling can reach any tenant | All migrations with RLS | ✅ Active |
| **Multi-tenant isolation** | Every application query also has `.eq('company_id', company_id)` as defense-in-depth | All route handlers | ✅ Active |
| **Service-role isolation** | `SUPABASE_SERVICE_ROLE_KEY` imported only in `lib/supabase/admin.ts` with `import 'server-only'` | `lib/supabase/admin.ts` | ✅ Active |
| **Service-role isolation** | Every admin client usage site has an inline comment justifying the RLS bypass | `lib/supabase/admin.ts` import sites | ✅ Active |
| **Input security** | Zod validates every API route and Server Action input before any DB call | All route handlers | ✅ Active |
| **Input security** | Supabase JS client uses parameterized queries — no raw SQL string interpolation | Architecture | ✅ Active |
| **Input security** | Error responses never expose internal stack traces or Supabase error messages | `fail()` helper in all API routes | ✅ Active |
| **Cookies** | Monitor cookie (`opsf_monitor`) and impersonation cookie (`opsf_impersonation`) are HMAC-SHA256 signed with `timingSafeEqual` comparison | `lib/auth/impersonation.ts` | ✅ Active |
| **Cookies** | Both cookies are `HttpOnly`, `Secure` (prod), `SameSite=Lax` | `lib/auth/impersonation.ts` | ✅ Active |
| **Audit trail** | Super-admin impersonation logged to `impersonation_events` (start + stop, timestamp, IP hash) | `supabase/migrations/20260422000001_impersonation_audit.sql` | ✅ Active |
| **Audit trail** | Data exports logged to `data_export_events` (who, when, format, entity scope, row count, IP hash) | `supabase/migrations/20260429000001_data_export_events.sql` | ✅ Added 2026-04-29 |
| **Export security** | Data export endpoint is admin-only (`getCompanyContext('admin')`) | `app/api/exports/[format]/route.ts` | ✅ Added 2026-04-29 |
| **Export security** | Export rate-limited to 5 per company per rolling hour | `lib/export/rate-limit.ts` | ✅ Added 2026-04-29 |
| **Export security** | Exports stream directly to browser — no copy written to Supabase Storage or filesystem | `app/api/exports/[format]/route.ts` | ✅ Added 2026-04-29 |
| **Export security** | Sensitive fields excluded from export: qr_scans, invite tokens, storage URLs, print configs | `lib/export/bundle.ts` | ✅ Added 2026-04-29 |
| **Rate limiting** | QR scan logging rate-limited by IP hash per QR code (prevents scan flooding) | `lib/qr/rate-limit.ts` | ✅ Active |
| **Rate limiting** | Employee claim paths (phone lookup and personal token) rate-limited at 5 attempts per IP per 15 minutes; IP stored as SHA-256 hash, never plaintext | `lib/employees/claim-rate-limit.ts` | ✅ Added 2026-05-01 |
| **Rate limiting** | Self-serve join requests rate-limited by IP hash before any DB read | `lib/employees/claim-rate-limit.ts` | ✅ Added 2026-05-01 |
| **Employee onboarding** | Personal invite tokens are 128-bit cryptographically random UUIDs (`crypto.randomUUID()`); single-use (tombstoned on claim); 7-day TTL enforced server-side | `app/dashboard/employees/_actions/employees.ts` | ✅ Added 2026-05-01 |
| **Employee onboarding** | Token claim path (`/join/claim/[token]`) never reveals whether a token exists, is expired, or is already claimed — only "not valid", "already used", or "expired" messages, no server-state hints | `app/join/claim/[token]/page.tsx` | ✅ Added 2026-05-01 |
| **Employee onboarding** | Phone-based claim path returns a single generic error for all failure modes (rate limit, not found, expired, already claimed) — prevents phone enumeration via the company QR | `app/join/[company_id]/_actions/claim-invite.ts` | ✅ Added 2026-05-01 |
| **Employee onboarding** | Self-serve join requests always return success to the caller, including on duplicate phone submissions — never reveals whether a phone is registered | `app/join/[company_id]/request/_actions/create-join-request.ts` | ✅ Added 2026-05-01 |
| **Employee onboarding** | Manager-generated "access link" tokens are Clerk sign-in tokens (1-hour TTL, single-use); scoped to verified company members only — manager cannot generate a token for a user outside their company | `app/dashboard/employees/_actions/resend-access.ts` | ✅ Added 2026-05-01 |

---

## Known Gaps

| Gap | Severity | Status | Notes |
|---|---|---|---|
| No Dependabot / automated dependency scanning | Low | 🔴 Open | Enable in GitHub repo settings → Security. 10-minute fix. |
| No GitHub Actions secret-scanning workflow | Low | 🔴 Open | Add `trufflesecurity/trufflehog-actions-scan` to CI. |
| No rate limiting on general API mutations (beyond exports, QR scans, and employee claim paths) | Low | 🟡 Deferred | Phase 2 hardening. Assess after first 90 days of traffic. |
| CSP uses `unsafe-inline` and `unsafe-eval` | Medium | 🟡 Constrained | Required by Clerk hosted components. Tighten when Clerk provides nonce-based CSP guidance. Track Clerk CSP roadmap. |
| Team member emails in Clerk, not Supabase | Informational | 🟡 By design | Documented in export `_meta.pii_note`. Not a gap — Clerk owns identity. Note in customer PII responses. |
| No automated penetration testing schedule | Medium | 🔴 Open | Recommend annual pentest before enterprise sales. |

---

## Customer FAQ

**Q: Can other companies see our data?**
> No. Every row in our database is tagged with your company ID, and PostgreSQL Row Level Security enforces that filter at the database layer — not just in application code. Even if our application had a bug, the database would return zero rows from another company. Two independent layers must fail simultaneously for a cross-tenant leak to be possible.

**Q: Who can export our data?**
> Only org admins. The export endpoint enforces this server-side on every request. Managers and employees cannot reach the export tab at all — the route handler rejects non-admin sessions before assembling any data.

**Q: Is our data stored on your servers when we export it?**
> No. The export streams directly from our database to your browser in a single HTTPS response. We don't write a copy to storage, a temp file, or any cloud bucket. The only copy is the file in your Downloads folder.

**Q: Can we tell who exported our data?**
> Yes. Every export is logged to an audit table with the admin's user ID, timestamp, export format, number of rows, and a hashed IP address. This is visible in the Exports tab under "Export audit trail."

**Q: What about employees — can they access the raw data?**
> No. Employees can only view SOPs and announcements assigned to their departments. The export feature is restricted to org admins. Employees authenticate via magic link — there are no passwords that could be phished or compromised.

**Q: How do employee invite links work, and can they be guessed or reused?**
> Each invite generates a 128-bit cryptographically random token (the same entropy as a UUID v4). Brute-forcing the token space would require more attempts than is computationally feasible. Links expire after 7 days and are permanently invalidated the moment they are used — a second tap on the same link is rejected. The claim endpoint is also IP rate-limited to 5 attempts per 15 minutes.

**Q: Can an attacker enumerate which phone numbers are registered?**
> No. The company join page returns an identical generic error message regardless of whether a phone number exists in the system, is expired, is already claimed, or triggers the rate limit. There is no timing difference between these paths. The self-serve request form also always returns success — submitting a phone that is already registered produces the same response as a new one.

**Q: How is data encrypted in transit?**
> All traffic is HTTPS-only (TLS 1.2+). Vercel enforces this on every request — there is no HTTP fallback. HTTP Strict Transport Security headers instruct browsers to always use HTTPS even if a link is typed as HTTP.

**Q: What security headers do you set?**
> Content-Security-Policy, Strict-Transport-Security (HSTS), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy are set on every response via `next.config.ts`.

---

## Change Log

| Date | Change | Branch |
|---|---|---|
| 2026-04-29 | Added HTTP security headers (`next.config.ts`): HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy | `claude/org-settings-data-export-VtSJR` |
| 2026-04-29 | Added data export feature: `data_export_events` audit table, rate limiting (5/hour), admin-only access, streaming download, no server-side copy | `claude/org-settings-data-export-VtSJR` |
| 2026-04-29 | This document created | `claude/org-settings-data-export-VtSJR` |
| 2026-05-01 | Added employee invite security controls: personal invite tokens (128-bit UUID, 7-day TTL, single-use tombstone), IP rate limiting on all claim paths, generic error hardening on phone lookup, self-serve join request always-success pattern, manager access-link scoping | `claude/improve-employee-invitations-Nf7IQ` |
