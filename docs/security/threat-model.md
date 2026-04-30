# OpsFluency — Threat Model

> Last updated: 2026-04-30
> Scope: company intranet deployments, PWA, QR code entry points, monitor kiosks

---

## Architecture Overview (security lens)

```
Internet
  └─ Vercel Edge (TLS termination, security headers)
       ├─ Next.js App Router (Server Components, Server Actions, API routes)
       │    ├─ Clerk (auth — identity + magic links only)
       │    └─ Supabase (Postgres + Storage, RLS-enforced)
       │         ├─ getRequestClient()  — authenticated, RLS on
       │         └─ getAdminClient()    — service role, RLS bypassed
       ├─ Employee PWA  (service worker, offline cache, QR entry)
       └─ Monitor kiosks  (signed cookie auth, no Clerk session)
```

---

## Threat Surface Map

### 1. Service Worker / PWA Cache

**Risk:** The service worker caches SOP content on employee devices (up to 20 SOPs). A compromised or shared device exposes cached SOPs without requiring re-authentication.

**What's at risk:** proprietary process documents, safety procedures, equipment specifics — all readable from the browser cache without a network call.

**Mitigations:**
- Scope the service worker cache to `/app/` routes only — never `/api/` responses or anything containing JSON payloads
- Explicitly exclude HR chat (`/app/hr/`) from the offline cache
- Set `Cache-Control: no-store` on all API JSON responses so the SW cannot accidentally cache them
- Document to customers that shared/kiosk devices should use browser private mode or have the cache cleared on session end

**Residual risk:** Low. Cached content is read-only SOP text — no credentials, no PII beyond what's in the SOP itself.

---

### 2. QR Code Spoofing / Phishing

**Risk:** Anyone can print a QR code pointing to a domain that mimics `opsfluency.com`. Warehouse employees, often working quickly and in poor lighting, may not inspect the URL before scanning.

**Attack pattern:** Fake QR → spoofed sign-in page → employee enters magic link email → attacker requests a real magic link → intercepts if email is unprotected.

**Mitigations:**
- Clerk magic links can only redirect to your `NEXT_PUBLIC_APP_URL` — open-redirect is blocked by Clerk's allowed origins config; verify this is locked down
- Your `/s/<qr_code_id>` route is the only valid QR entry point; the UUID-based ID is not guessable
- Operational: instruct managers to laminate and physically secure posted QR codes; make clear to employees the app URL (`opsfluency.com`) should always appear in the browser bar after scanning
- Consider adding a brief domain-check prompt in onboarding ("The app will always show opsfluency.com after you scan")

**Residual risk:** Low-medium — operational, not technical. Mitigated primarily by employee training.

---

### 3. Magic Link Interception

**Risk:** If company email runs on an on-premise mail server on the same network segment as employees, a network-level attacker (rogue device, MITM on unencrypted SMTP) could intercept magic links before the employee clicks.

**Mitigations:**
- Magic links are single-use and expire (Clerk default; confirm TTL is ≤24h — current setting is 72h, consider reducing)
- All Clerk-to-browser communication is HTTPS-enforced
- The risk is limited to the internal mail path, not your application's transport layer
- Recommend customers use cloud email (Google Workspace, M365) rather than on-prem SMTP

**Residual risk:** Low. Depends on the customer's mail infrastructure, which is outside your control surface.

---

### 4. Monitor Kiosk Compromise

**Risk:** The `opsf_monitor` cookie is HttpOnly + SameSite=Lax with no expiration. A physically accessible TV browser in kiosk mode is a long-lived credential. If the TV is reset, accessed via developer tools, or the kiosk mode is exited, the cookie could be extracted or replayed.

**What's at risk:** read access to all department content for that company for as long as the cookie is valid (indefinitely).

**Mitigations already in place:**
- Cookie is HMAC-SHA256 signed — tampering detected on every request
- HttpOnly prevents JS access; no XSS path to the cookie if CSP is properly configured
- `monitor_id` mismatch check means a cookie from Monitor A cannot auth Monitor B

**Additional mitigations to consider:**
- Add monitor heartbeat IP tracking — flag (don't block) if the heartbeat IP changes significantly (geo shift); surface in the super-admin console
- Document the "unpair" flow clearly: rotating `MONITOR_COOKIE_SECRET` invalidates all monitors and requires re-pairing — this is the nuclear option for a compromised TV

**Residual risk:** Medium for physical access scenarios. Monitor content is department announcements + scheduled content — no employee PII, no HR data.

---

### 5. Cross-Tenant Data Isolation Failure

**Risk:** A bug in RLS helpers, a missing `.eq('company_id', ...)` filter, or a misconfigured third-party auth bridge could expose one company's data to another.

**This is the highest-consequence risk in the system.**

**Mitigations already in place:**
- RLS enabled on every company-scoped table from day one
- `requesting_company_id()` is `SECURITY DEFINER` — reads `auth.jwt() ->> 'sub'` directly, cannot be manipulated by application code
- Every tenant policy includes an isolation clause in both `USING` and `WITH CHECK`
- Defense-in-depth: every application query also includes `.eq('company_id', company_id)`
- `getRequestClient()` forwards the Clerk JWT — no anonymous or service-role access from app code
- Clerk → Supabase JWT bridge validated on every request (Supabase validates the `iss` claim against the Clerk Frontend API URL)

**Mitigations to add:**
- Periodic RLS audit: run `SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public'` and verify every row has `rowsecurity = true` — automate this as a CI check or cron
- Add an integration test that signs in as Company A and verifies Company B's `sop_ids` return zero rows

**Residual risk:** Low (by design). Two independent systems (RLS + app filter) must fail simultaneously. The JWT bridge misconfiguration scenario (wrong `iss` claim) is the most likely failure mode — it produces empty results, not data leakage.

---

### 6. XSS via Rendered Markdown

**Risk:** SOP content is converted by Sonnet from raw documents and stored as Markdown. If the Markdown renderer doesn't sanitize output, a crafted document could inject script tags that execute in the employee PWA.

**Attack path:** Attacker uploads a malicious DOCX → Sonnet converts it → Markdown contains `<script>` or `javascript:` href → rendered in the SOP viewer → XSS in the employee session.

**Mitigations:**
- Use `rehype-sanitize` (or equivalent) in the Markdown → HTML render pipeline; this is not yet implemented — add before first real tenants
- CSP header (`script-src`) provides a second layer — even if a script tag lands in the DOM, it won't execute if it's not from an allowed origin
- Sonnet is unlikely to reproduce script tags verbatim, but "unlikely" is not a control

**Residual risk:** Medium until `rehype-sanitize` is added. High priority before production.

---

### 7. Unauthenticated Scan Endpoint Abuse

**Risk:** `POST /api/sops/:id/scans` must accept unauthenticated calls (employees may not have a Clerk session when the QR scan triggers the log). Without rate limiting, an attacker could flood this endpoint to inflate scan analytics or trigger DoS against the logging path.

**Mitigations already in place:**
- Rate limited by IP hash + `qr_code_id` via `lib/qr/rate-limit.ts`

**Verify before launch:**
- Confirm the rate limiter is wired into the route handler (not just defined as a utility)
- Confirm the limit is tight enough (e.g., 10 requests/IP/minute per QR code)
- The endpoint writes to `sop_scans` — verify the write path uses the admin client with explicit `sop_id` validation against the `qr_codes` table, not a user-supplied `sop_id` directly

**Residual risk:** Low if rate limiter is active.

---

### 8. HR Chat Confidentiality

**Risk:** HR conversations between employees and HR contacts may contain sensitive disclosures (complaints, medical context, disciplinary matters). These are stored in `hr_chats` / `hr_chat_messages` and must not appear in:
- The service worker cache
- Data exports (unless the exporting admin specifically acknowledges the sensitivity)
- Monitor displays

**Mitigations:**
- Explicitly exclude `/app/hr/` routes from SW cache
- Audit the data export bundle — confirm `hr_chats` and `hr_chat_messages` are either excluded or require a separate export permission
- HR content is already scoped to the HR department — employees in other departments cannot reach it

**Residual risk:** Low with explicit SW exclusion. Medium if export bundle accidentally includes HR chat content.

---

### 9. AI Key / Credential Exposure

**Risk:** `ANTHROPIC_API_KEY` and `GOOGLE_CLOUD_TRANSLATION_API_KEY` are server-only env vars. If they are ever accidentally referenced in a `NEXT_PUBLIC_` variable or imported in a client component, they appear in the browser bundle and are readable by anyone who views source.

**Mitigations already in place:**
- All AI calls go through `lib/ai/sonnet.ts` which is server-only
- Translation calls go through `lib/translation/` — server-only
- Supabase service role key is gated behind `import 'server-only'` in `lib/supabase/admin.ts`

**Verify periodically:**
- Run `grep -r "ANTHROPIC_API_KEY\|GOOGLE_CLOUD\|SERVICE_ROLE" app/` — any hit outside a Server Component or API route is a bug
- Vercel's environment variable scoping should mark these as "server" (not "client") — confirm in Vercel dashboard

**Residual risk:** Low. Architecture makes this hard to do accidentally.

---

## Risk Summary

| Threat | Severity | Status |
|---|---|---|
| XSS via unsan­itized Markdown | **Medium** | 🔴 Open — add `rehype-sanitize` before launch |
| Service worker caching sensitive responses | **Medium** | 🟡 Needs explicit exclusions (HR chat, API JSON) |
| QR code spoofing / phishing | **Low–Medium** | 🟡 Operational — employee training + Clerk redirect lock |
| Monitor kiosk physical access | **Medium** | 🟡 Accepted — HttpOnly cookie + unpair runbook |
| Cross-tenant RLS bypass | **Critical** | ✅ Mitigated — dual-layer isolation |
| Magic link interception | **Low** | ✅ Mitigated — single-use, short-lived, HTTPS |
| Scan endpoint abuse | **Low** | ✅ Mitigated — rate limiter in place (verify wiring) |
| AI key exposure in bundle | **Low** | ✅ Mitigated — server-only import chain |
| HR chat in export/cache | **Medium** | 🟡 Audit export bundle + SW exclusion |

---

## Pre-Launch Checklist

- [ ] Add `rehype-sanitize` to the Markdown render pipeline in the SOP viewer
- [ ] Explicitly exclude `/app/hr/` and all `/api/` responses from the service worker cache
- [ ] Reduce magic link TTL from 72h → 24h in Clerk dashboard
- [ ] Verify QR scan rate limiter is wired into `POST /api/sops/:id/scans` handler
- [ ] Verify Clerk allowed redirect origins locks to `NEXT_PUBLIC_APP_URL` only
- [ ] Audit data export bundle — confirm HR chat tables are excluded or require explicit opt-in
- [ ] Enable GitHub Dependabot (repo → Settings → Security) for automated dependency CVE alerts
- [ ] Add `trufflesecurity/trufflehog-actions-scan` to CI to catch secrets committed accidentally
- [ ] Write an integration test: Company A session → query Company B sop_ids → assert empty result

---

## See Also

- [`security.md`](./security.md) — active controls, known gaps, customer FAQ, change log
- [`../pricing.md`](../pricing.md) — AI cost model and margin thresholds
- [`CLAUDE.md`](../../CLAUDE.md) — Supabase three-client model, RLS helpers, auth bridge
