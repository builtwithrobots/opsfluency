# OpsFluency — Development Roadmap

> **Live document.** Check boxes as work lands in `main`. Add notes inline when a decision changes scope.
> Last sync: May 2026 — reflects current codebase state as of migration `20260518000001`.

---

## How to use this doc

- Check a box the moment the feature merges to `main` (not when the branch exists).
- If a task is de-scoped, strike it out and add a one-line reason — don't delete it.
- Dependencies are noted inline. Never start a dependent task until its parent is checked.
- Phase 0 items are already shipped; they exist as the baseline for estimating what's left.

---

## Phase 0 — Foundation (Shipped)

Core infrastructure that is already in `main` and running in production. Checked here as the ground truth baseline.

### Multi-Tenant Auth & Identity
- [x] Clerk integration — magic-link auth, session tokens
- [x] `companies` + `company_members` tables — company_id-first tenancy (not Clerk org)
- [x] `super_admins` table + `is_super_admin()` SQL helper
- [x] `requesting_company_id()` + `requesting_role()` RLS helpers
- [x] RLS enabled on every company-scoped table with `OR is_super_admin()` in all policies
- [x] `getCompanyContext()` — single auth/company resolver for all server code
- [x] Clerk → Supabase JWT bridge (third-party auth provider config)
- [x] Super-admin impersonation cookie flow + `impersonation_events` audit log
- [x] Account locking (`company_members.locked_at`)
- [x] Org owner marker (`company_members.is_owner`)
- [x] `super_admin_events` audit log for destructive cross-tenant actions

### Onboarding & Company Setup
- [x] Onboarding wizard (company name, address, industry packages)
- [x] `bootstrap_company()` DB function — seeds 5 default departments on org creation
- [x] Industry packages (`general`, `iso9001`, `food-safety`, `healthcare`) — multi-select
- [x] `is_demo` flag on companies for sandbox tenants
- [x] Personal sandbox company per super admin
- [x] Soft-deactivation (`companies.deactivated_at`)

### SOP Import Pipeline
- [x] File upload to `sop-uploads` Storage bucket (PDF, DOCX, TXT)
- [x] PDF text extraction with fallback to Sonnet vision (`lib/ai/pdf-extraction.ts`)
- [x] DOCX text extraction via mammoth (`lib/ai/docx-extraction.ts`)
- [x] Sonnet Call 1 — raw document → clean Markdown (16,384 max tokens)
- [x] Sonnet Call 2 — Markdown + glossary → flagged site-specific terms (4,096 max tokens)
- [x] `ai_call_log` — per-call cost tracking (model, tokens, cache breakdown, duration)
- [x] Prompt caching on Sonnet system prompts (`cache_control: ephemeral`)
- [x] 180s hard timeout + 1 retry on 429/5xx with jittered backoff
- [x] Manager glossary review gate (hard gate — translation blocked until all terms defined)
- [x] Google Cloud Translation with glossary injection (`lib/translation/google.ts`)
- [x] Auto-publish on translation complete (pending_translation → published)
- [x] `sop_versions` — versioned EN + ES content storage
- [x] `needs_retranslation` flag on sop_versions (set on English edit)
- [x] SOP status lifecycle (`draft` → `pending_terms` → `pending_translation` → `published` → `archived`)
- [x] Status transition validation (one-way gates, transaction-scoped)
- [x] Template recommender (Haiku picks from 4 templates; stored as `template_recommendation`)
- [x] Flexible document type (`sops.document_type` — SOP, policy, job aid, etc.)

### SOP Display & Templates
- [x] `step-by-step` template renderer
- [x] `reference` template renderer
- [x] `safety-checklist` template renderer
- [x] `onboarding` template renderer
- [x] Audience picker (template selection UI)
- [x] SOP audience targeting (`audience_department_ids`, `audience_roles`)
- [x] SOP video URL attachment (YouTube / Loom / Vimeo embed)
- [x] `sop_images` — manager-uploaded procedure images (public CDN bucket)

### Glossary System
- [x] `glossary_terms` table (EN + ES, soft delete)
- [x] Company glossary management UI
- [x] Tags on glossary terms (`glossary_term_tags` junction)
- [x] Glossary always injected into Sonnet and Google Translate calls

### QR Code System
- [x] `qr_codes` table — permanent, polymorphic (SOP, announcement, URL)
- [x] QR URL shape: `/s/<qr_code_id>` (UUID-stable, never sop_id)
- [x] `/s/[qr_code_id]` public scan landing — resolves SOP, redirects auth
- [x] HTTP 410 response for archived SOP QR scans
- [x] `sop_scans` logging (async, rate-limited by IP + qr_code_id)
- [x] QR print layout (8.5×11, DotSlider, accordion sections)
- [x] QR print design defaults (`companies.qr_design_defaults` JSONB)
- [x] QR audience targeting (`audience_department_ids`, `audience_role_filter`)
- [x] QR soft archive (`qr_codes.archived_at`) + hard delete from archive
- [x] QR scheduling window (`active_from`, `active_until`)
- [x] Org-wide QR design defaults

### Department & Team Management
- [x] `departments` table (color_hex, icon_key, sort_order, is_system flag)
- [x] `employee_departments` junction table
- [x] 5 default system departments (HR, Manufacturing, Quality Control, Safety, Warehouse)
- [x] Department create / rename / reorder / delete (non-system only)
- [x] Department package_key (tracks which industry package seeded each dept)
- [x] Tags synced to department colors
- [x] Team invite flow (email-based, with department pre-assignment)
- [x] `team_invites` table + `claim-invite` server action
- [x] Admin / manager roles in `company_members`

### Employee Management
- [x] `employees` extended profile (phone, preferred_language, last_active_at)
- [x] `employee_invites` — dual-email (work + personal), QR-claim token
- [x] Personal invite token (UUID, expiry) for zero-friction join link
- [x] Employee management UI (invite, resend, remove)

### Announcements
- [x] `announcements` table (department-scoped or org-wide)
- [x] `announcement_reads` table (per-employee read tracking)
- [x] Video URL on announcements (YouTube / Loom / Vimeo embed + link button)
- [x] Announcement create / edit / archive UI

### Tags & Labels
- [x] `tags` company vocabulary (bilingual, soft delete, created_by)
- [x] `sop_tags` junction table
- [x] Labels manager UI (rename, archive, color)
- [x] System labels (department-sourced, locked) + custom labels

### Worker PWA
- [x] PWA manifest + next-pwa service worker
- [x] Employee home dashboard (announcements + dept tabs)
- [x] SOP viewer (bilingual, template-rendered)
- [x] QR scan entry point (`/app/scan`)
- [x] SOP search page
- [x] Worker profile page

### Monitor System
- [x] Monitor pairing flow (`/pair-monitor`)
- [x] Signed `opsf_monitor` cookie (MONITOR_COOKIE_SECRET, no expiry)
- [x] `/monitor/[id]` — server-side cookie verification, company-scoped content
- [x] `monitors` table (department-scoped)
- [x] Monitor heartbeat API (`POST /api/monitors/heartbeat`)
- [x] Monitor display: dark theme, 1280×720 min, auto-refresh, heartbeat indicator

### HR Module
- [x] `hr_contacts` table (richer schema with manager phone)
- [x] HR contacts directory UI (worker-facing)
- [x] HR chat tables (`hr_chats`, `hr_chat_messages`) — schema only
- [ ] HR chat UI — worker to HR messaging *(schema exists, UI not yet built)*

### Analytics
- [x] Basic scan count analytics (`sop_scans` rollup)
- [x] Announcement read tracking (`announcement_reads`)
- [x] AI usage console (`/dashboard/platform?tab=ai`) — per-tenant cost by model

### Platform / Super Admin Console
- [x] Tenant list + impersonation
- [x] Per-tenant plan tier management
- [x] Per-tenant AI history delete
- [x] Tenant deactivation / restore
- [x] Demo tenant seed tool
- [x] Super admin add / remove
- [x] Member delete + account locking

### Infrastructure
- [x] Three-client Supabase model (request / admin / browser)
- [x] `SUPABASE_SERVICE_ROLE_KEY` isolated to `lib/supabase/admin.ts` + `import 'server-only'`
- [x] Zod validation at every server entry point
- [x] Standard error envelope (`{ error: { code, message?, details? } }`)
- [x] Server Actions for all session-authed mutations (no API round-trips)
- [x] `/api` routes reserved for webhooks, monitor heartbeat, QR scan logging, cron
- [x] Data export (CSV + bundle) with audit log (`data_export_events`)
- [x] Rate limiting on scan logging and export

---

## Phase 1 — MVP Completion

Features needed before public launch. Some are scaffolded; some are net-new.

### Marketing Site
- [ ] `/` — landing page (hero, value prop, social proof)
- [ ] `/features` — feature breakdown page
- [ ] `/how-it-works` — step-by-step for managers and employees
- [ ] `/pricing` — pricing tiers (reconcile `docs/pricing.md` $79/$119/$199 vs PRD $149/$349 first)
- [ ] `/about` — company / founder story
- [ ] `/contact` — contact form wired to real endpoint
- [ ] `/terms` — Terms of Service
- [ ] `/privacy` — Privacy Policy

### Billing
- [ ] Stripe Checkout Session integration (follow `stripe-best-practices` skill)
- [ ] Webhook handler: `customer.subscription.created` → set `companies.plan_tier`
- [ ] Webhook handler: `customer.subscription.updated` / `deleted` → update / deactivate
- [ ] Billing portal link in Org Settings
- [ ] Plan tier gate on dashboard — block access when subscription lapses
- [ ] Trial period (14 days) with countdown banner
- [ ] Pricing reconciliation: confirm $79/$119/$199/$249 tiers in code + marketing

### HR Chat
- [ ] HR chat UI — worker initiates from `/app/hr`
- [ ] HR chat UI — manager responds from `/dashboard/` HR inbox
- [ ] Real-time updates (Supabase Realtime subscription on `hr_chat_messages`)
- [ ] Unread badge on manager HR nav item
- [ ] Chat notification email to manager (Clerk email or Resend)

### Worker PWA Polish
- [ ] Offline cache: last 20 SOPs + home dashboard (cache-first strategy)
- [ ] Offline cache: static assets (cache-first)
- [ ] Network-first strategy for announcements
- [ ] Offline indicator banner when service worker detects no connectivity
- [ ] Push notification opt-in for announcements (Web Push API)
- [ ] Language toggle persisted to `employees.preferred_language` on change
- [ ] PWA install prompt (beforeinstallprompt) on worker home

### SOP Management Polish
- [ ] SOP list search + filter by status, department, template, tag
- [ ] SOP duplication (copy as new draft)
- [ ] SOP archive with confirmation and QR 410 preview
- [ ] Bulk SOP tag assignment
- [ ] SOP version history viewer (diff between published versions)
- [ ] `needs_retranslation` banner on published SOP when flag is set
- [ ] Re-translate flow: trigger new Google Translate call, update `sop_versions`

### Accessibility Audit
- [ ] Run `npx @axe-core/cli` on all 5 primary routes — zero `wcag2a` / `wcag2aa` violations
- [ ] Run Lighthouse a11y on all 5 primary routes — score ≥ 95
- [ ] Manual check: glove-friendly tap targets (≥ 44px) on all PWA interactive elements
- [ ] Manual check: bilingual `lang` attribute switches correctly on language toggle
- [ ] Manual check: focus indicators visible on all focusable elements
- [ ] Manual check: all images have meaningful alt text

### Monitor Phase 2 Content
- [ ] Department announcement ticker (latest 3 announcements for the dept)
- [ ] Safety SOP of the day widget (pinnable by manager)
- [ ] Employee recognition widget (manager posts a shoutout)
- [ ] Monitor content manager UI (`/dashboard/monitors/[id]/content`)

---

## Phase 2 — Competitive Moat

These features are the strategic differentiators. They create switching costs, data flywheels, and compound value over time. Build them in the order listed — each one unlocks the next.

### 2A — Translation Memory *(lowest effort, immediate ROI)*

**Why first:** Cuts Google Cloud Translation costs ~30–60% for active tenants within 3 months. Creates company-specific linguistic consistency. Starts the data flywheel. Ships in a single sprint.

**Schema:**
```sql
CREATE TABLE translation_memory (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID REFERENCES companies(id) ON DELETE CASCADE,
  content_hash  TEXT NOT NULL,           -- SHA-256 of source English text
  source_text   TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  language_code TEXT NOT NULL DEFAULT 'es',
  source        TEXT NOT NULL DEFAULT 'google', -- 'google' | 'manager_edit'
  approved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, content_hash, language_code)
);
```

- [x] `20260527000001_translation_memory.sql` — create table, RLS, company isolation policy
- [x] `lib/translation/memory.ts` — `lookupTM(company_id, hashes, lang)` + `saveTM(...)` helpers (SHA-256 keyed, batch ops, upsert with ignoreDuplicates)
- [x] Wire TM lookup into `lib/translation/structured.ts` — leaf-level cache for SOP translation (TM hit applies translation directly; miss goes to Google, result saved to TM)
- [x] Wire TM lookup into `lib/translation/google.ts` — full-text cache for short strings (glossary terms, captions, announcements)
- [x] Mark manager-approved edits as `source: 'manager_edit'` — `saveSpanishEdit` action paragraph-pairs EN/ES content and saves qualifying segments to TM with `source: 'manager_edit'` after every successful Spanish save
- [x] TM hit rate telemetry in `ai_call_log` (added `tm_hits INT DEFAULT 0` column in `20260527000002_ai_call_log_tm_hits.sql`)
- [x] TM stats widget on platform AI console — headline `SimpleStat` for total TM cache hits; per-tenant "TM hits" column (green) in top-tenants table; legend entry explaining segment savings
- [ ] Migration to back-fill existing published `sop_versions` into TM on first use

### 2B — Comprehension Verification (Post-SOP Quizzes)

**Why second:** Turns OpsFluency from "content delivery" into **verified competency** — the language OSHA, ISO 9001, and insurers use. Competency records create legal switching costs. Workers can't take their quiz history to a competitor.

**Schema:**
```sql
CREATE TABLE sop_quizzes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id       UUID REFERENCES sops(id) ON DELETE CASCADE,
  company_id   UUID REFERENCES companies(id) ON DELETE CASCADE,
  questions    JSONB NOT NULL, -- [{ q_en, q_es, options_en[], options_es[], correct_index }]
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  model        TEXT NOT NULL   -- which Haiku/Sonnet call generated this
);

CREATE TABLE sop_comprehension_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id       UUID REFERENCES sops(id) ON DELETE CASCADE,
  company_id   UUID REFERENCES companies(id) ON DELETE CASCADE,
  employee_id  UUID REFERENCES employees(id) ON DELETE SET NULL,
  quiz_id      UUID REFERENCES sop_quizzes(id),
  language     TEXT NOT NULL,  -- 'en' | 'es'
  answers      JSONB NOT NULL, -- [{ question_index, selected_index }]
  score        INT NOT NULL,   -- 0–100
  passed       BOOLEAN NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);
```

- [ ] `20260xxx_sop_quizzes.sql` — create both tables, RLS, company isolation
- [ ] `lib/ai/quiz-generator.ts` — Haiku call: Markdown + template → 3 bilingual questions (JSON output)
- [ ] Quiz generation wired into publish pipeline: generate after `published` status set
- [ ] Quiz generation wired into re-translation: regenerate when `needs_retranslation` clears
- [ ] Quiz caching: store generated quiz in `sop_quizzes`; only regenerate on SOP version change
- [ ] Worker PWA: quiz modal appears after scrolling ≥ 80% of SOP content
- [ ] Quiz UI: bilingual question display, 4 multiple-choice options, single-tap selection
- [ ] Quiz UI: immediate result screen (pass = green + "Good job!" / fail = retry once)
- [ ] Pass/fail + score written to `sop_comprehension_events`
- [ ] Quiz skippable (worker can dismiss — "I'll take this later") but skip is logged
- [ ] Manager dashboard: per-SOP pass rate card on SOP detail page
- [ ] Manager dashboard: per-employee comprehension history on employee profile
- [ ] Manager dashboard: department comprehension summary (% employees passed per SOP)
- [ ] Comprehension rate included in SOP Health Score (see 2C)
- [ ] Export: comprehension records included in data bundle export (OSHA audit trail)

### 2C — SOP Health Score

**Why third:** Requires scan data (Phase 0), comprehension data (2B), and version history (Phase 0). Surfaces to managers as a single actionable number per SOP. No competitor without your data depth can replicate this.

**Formula (v1):**
```
health_score = (
  0.30 × read_rate_30d          +  -- % of dept employees who read in last 30 days
  0.25 × comprehension_pass_rate + -- % who passed the quiz (0 if quiz disabled)
  0.25 × recency_score          +  -- 1.0 if updated < 90d, decays to 0 at 365d
  0.20 × re_read_rate_30d          -- % who re-read (shows relevance)
) × 100
```

- [ ] `lib/analytics/sop-health.ts` — compute health score from `sop_scans` + `sop_comprehension_events` + `sops.updated_at`
- [ ] Health score computed on-demand (not stored) — recalculated per request, cached 1 hour
- [ ] SOP list: health score badge (color-coded: green ≥ 75 / yellow 50–74 / red < 50)
- [ ] SOP detail page: health score breakdown widget (shows each component)
- [ ] Dashboard home: "SOPs that need attention" — 3 lowest health scores surfaced
- [ ] Weekly digest email to manager: health score summary (Resend or Clerk email)
- [ ] Health score trend line (7-day rolling average) on SOP detail analytics tab

### 2D — AI Knowledge Assistant ("Ask My SOPs")

**Why fourth:** Requires a published SOP library (Phase 0 + 1) and benefits massively from a large library — the data flywheel. More SOPs = better answers = more value = harder to leave.

**Architecture:**
- pgvector extension in Supabase for embedding storage
- Embed on publish: `sop_versions.content_en` + `sop_versions.content_es` → vector chunks
- Worker query → embed → cosine similarity search → top-5 chunks → Haiku synthesis
- Source citations returned with every answer (links to specific SOPs)

```sql
CREATE TABLE sop_embeddings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id       UUID REFERENCES sops(id) ON DELETE CASCADE,
  version_id   UUID REFERENCES sop_versions(id) ON DELETE CASCADE,
  company_id   UUID REFERENCES companies(id) ON DELETE CASCADE,
  language     TEXT NOT NULL,  -- 'en' | 'es'
  chunk_index  INT NOT NULL,
  chunk_text   TEXT NOT NULL,
  embedding    VECTOR(1536),   -- text-embedding-3-small dimensions
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON sop_embeddings USING ivfflat (embedding vector_cosine_ops);
```

- [ ] Enable `pgvector` extension in Supabase dashboard
- [ ] `20260xxx_sop_embeddings.sql` — create table + ivfflat index, RLS
- [ ] `lib/ai/embeddings.ts` — generate embeddings via OpenAI `text-embedding-3-small` (or Anthropic future endpoint when available)
- [ ] Embedding pipeline: triggered on SOP publish + re-translate; chunks at 512-token overlap
- [ ] Back-fill embeddings for all existing published SOPs (one-time migration script)
- [ ] `lib/ai/rag.ts` — `searchSOPs(company_id, query, language)` → top-5 chunks with metadata
- [ ] `lib/ai/rag.ts` — `synthesizeAnswer(chunks, query, language)` → Haiku answer + source citations
- [ ] Worker PWA: "Ask a question" search bar on home dashboard (below announcement feed)
- [ ] Worker PWA: answer UI — answer text + "Found in: [SOP Title]" citation chips
- [ ] Worker PWA: citation chip taps through to the relevant SOP
- [ ] Answer fallback: "I don't have a specific procedure for that — ask your manager" when similarity score < threshold
- [ ] Manager dashboard: Knowledge Assistant usage stats (queries per day, top questions)
- [ ] Knowledge Assistant available to managers at `/dashboard/assistant` for procedure lookup
- [ ] `ai_call_log` tracking for RAG synthesis calls (Haiku, low cost per query)

### 2E — Onboarding Path Builder

**Why fifth:** Creates structural switching costs. A company's custom onboarding sequences (Day 1, Forklift Cert, Safety Induction) live in OpsFluency. Builds naturally on departments, SOP audience targeting, and comprehension verification.

```sql
CREATE TABLE learning_paths (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  name_en     TEXT NOT NULL,
  name_es     TEXT NOT NULL,
  description_en TEXT,
  description_es TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_by  TEXT NOT NULL,  -- clerk_user_id
  archived_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE learning_path_steps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id       UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
  company_id    UUID REFERENCES companies(id) ON DELETE CASCADE,
  sop_id        UUID REFERENCES sops(id) ON DELETE CASCADE,
  step_order    INT NOT NULL,
  requires_quiz BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (path_id, step_order)
);

CREATE TABLE employee_path_assignments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id      UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
  employee_id  UUID REFERENCES employees(id) ON DELETE CASCADE,
  company_id   UUID REFERENCES companies(id) ON DELETE CASCADE,
  assigned_by  TEXT NOT NULL,  -- clerk_user_id
  assigned_at  TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE (path_id, employee_id)
);
```

- [ ] `20260xxx_learning_paths.sql` — all three tables, RLS, company isolation
- [ ] Manager UI: path builder at `/dashboard/paths`
- [ ] Manager UI: drag-and-drop step ordering
- [ ] Manager UI: assign path to employee(s) or entire department
- [ ] Worker PWA: "My Learning Path" tab on home when a path is assigned
- [ ] Worker PWA: path progress bar + step checklist
- [ ] Worker PWA: step locked until previous step's quiz is passed (if `requires_quiz`)
- [ ] Manager dashboard: path completion board — employee × step matrix (green/yellow/red)
- [ ] Auto-assign path on department assignment (manager configures default path per dept)
- [ ] Path completion notification to manager (Resend or Clerk email)
- [ ] Path completion certificate (PDF printable — name + date + SOPs completed)

### 2F — Voice Playback (EN + ES)

**Why sixth:** Warehouse environments are noisy. Workers have varying literacy levels. You already have clean bilingual Markdown — playback is a thin rendering layer. No competitor without your translation infrastructure can deliver this.

- [ ] Worker PWA SOP viewer: "Listen" play button in header toolbar
- [ ] Playback uses Web Speech API (`speechSynthesis`) — zero cost, no external dependency
- [ ] Language for playback follows `employees.preferred_language`
- [ ] Playback strips Markdown syntax before TTS (headings, bold, bullets → plain text)
- [ ] Step-by-step mode: reads one numbered step at a time, highlights active step
- [ ] Playback controls: play / pause / next step / previous step / speed (0.75× / 1× / 1.25×)
- [ ] Playback persists across SOP section scrolls (audio doesn't stop on scroll)
- [ ] Fallback: if `speechSynthesis` unavailable, hide button silently (no broken state)
- [ ] Evaluate hosted TTS (ElevenLabs / Google TTS) for higher-quality voice in Phase 3

---

## Phase 3 — Scale Features

Build when OpsFluency has 20+ paying customers and Phase 2 data flywheels are confirmed working.

### Additional Languages
- [ ] Architecture review: confirm `content_en` / `content_es` model can extend to N languages without schema change (add `content_pt`, `content_ht`, `content_zh` columns to `sop_versions`)
- [ ] Language picker in org settings — admins select active languages for their facility
- [ ] Portuguese (pt-BR) — Google Cloud Translation, same pipeline
- [ ] Haitian Creole (ht) — Google Cloud Translation (verify quality first)
- [ ] Mandarin Simplified (zh-CN) — Google Cloud Translation
- [ ] Per-language pricing add-on (each additional language = +$X/mo on subscription)
- [ ] Language-specific quiz generation (Haiku prompts for target language)

### Advanced Analytics
- [ ] SOP dwell time tracking (scroll depth + time-on-page via PWA events)
- [ ] Re-read rate per SOP (employees who scanned same SOP > 1× in 30 days)
- [ ] Drop-off analysis: which step/section do employees stop reading
- [ ] Department compliance report (% of dept employees who read each required SOP)
- [ ] Manager export: OSHA-ready compliance report PDF (employee × SOP × date read × passed)
- [ ] Anonymized industry benchmarks widget ("Warehouses like yours average X reads/month")

### SOP Intelligence
- [ ] SOP conflict/overlap detection — Sonnet compares new upload against published SOPs; flags contradictions and suggests consolidation
- [ ] SOP staleness detector — flags SOPs not updated in > 12 months for manager review
- [ ] Incident-to-SOP gap report — when an incident is filed, surface which SOP covers the procedure and whether the involved employee had read it (requires incident reporting module)

### Incident Reporting Module *(unblocks SOP Intelligence gap report)*
- [ ] `incidents` table (employee-submitted, department-scoped)
- [ ] Worker PWA: incident report form (type, description, equipment, time)
- [ ] Manager dashboard: incident inbox with SOP-gap annotations
- [ ] Incident → corrective action linking (mark SOP for update as corrective action)

### Integrations
- [ ] Webhook outbound: SOP published → POST to customer endpoint (Zapier / Make compatible)
- [ ] HRIS import: bulk employee upload via CSV template
- [ ] Slack notification: manager receives alert when comprehension pass rate drops below threshold
- [ ] API key management: customers can generate read-only API keys for BI tool exports

---

## Debt & Maintenance

Running list of known tech debt. Address before each major phase ships.

- [ ] Pricing reconciliation: align `docs/pricing.md` ($79/$119/$199) with PRD.md tiers before any external pricing page goes live
- [ ] `sop_template_locked` column on companies — UI for admin to lock template choice (column exists, no manager-facing UI)
- [ ] Google Translation v3 + registered glossary — eliminates placeholder-substitution workaround; worth doing when glossary size exceeds 100 terms per tenant
- [ ] Rate limiting on `createSopFromUpload` — 100/hr, 200/day per tenant; add when first paying customer onboards
- [ ] `lib/supabase/browser.ts` audit — confirm no import leaks the anon key to server-only paths
- [ ] `npm audit` pass — resolve any high/critical severity findings before public launch
- [ ] Pre-extract text from digital PDFs before Sonnet vision (5–10× cheaper on text-layer PDFs) — see `docs/pricing.md` optimization levers
- [ ] HR chat: wire `hr_chats` / `hr_chat_messages` schema to a real UI (schema exists, UI incomplete)
- [ ] Monitor content: MVP shows placeholder — Phase 2 content modules are not yet defined in code

---

## Decision Log

Decisions that changed scope or direction after this roadmap was written. Add a row each time something material changes.

| Date | Decision | Reason |
|---|---|---| 
| 2026-05-27 | Ordered Phase 2 moat features: TM → Quizzes → Health Score → RAG → Paths → Voice | TM ships fastest and starts cost flywheel; Quizzes unlock the compliance value prop before RAG is built |
| 2026-05-27 | Haiku rejected for SOP Markdown conversion (Call 1) | Quality floor > cost savings for safety-critical docs; both calls stay on Sonnet |
| 2026-04-27 | Dropped manager approval step from SOP pipeline | Translation auto-publishes; `pending_approval` status removed |
| 2026-04-xx | Clerk Organizations not used | Company/tenancy managed entirely in Supabase `companies` + `company_members` |
