# OpsFluency — Comprehension Verification (Quiz System) Feature Plan

> **Live checklist.** Check boxes as work lands in `main`.
> Companion to `docs/dev/roadmap.md` Phase 2B.
> Last updated: May 2026

---

## Design Decisions (locked before dev)

| # | Question | Decision | Rationale |
|---|---|---|---|
| 1 | Pass threshold | **67% default (2 of 3 correct)** — manager-configurable per department | OSHA 29 CFR does NOT mandate a specific score. Requires "demonstrated competence" only. Industry EHS standard is 70–80%; for exactly 3 questions, 67% (2/3) is the practical floor. OSHA record retention: **3 years minimum** for General Industry training records (forklifts, PPE, HAZCOM). |
| 2 | Question count | **3 per SOP** (fixed for MVP) | Enough to demonstrate comprehension; short enough that workers don't skip. All 3 bilingual. |
| 3 | Retry policy | **Manager-set per department** — default: 2 attempts before "ask your manager" message; manager can set 1–5 or unlimited | Prevents "keep clicking until I pass" while letting high-stakes depts require perfect scores on first try |
| 4 | Version change | **Keep all history; manager-optional re-quiz push** | Existing `passed` records are immutable audit trail. When English is updated, new quiz auto-generates. Manager can mark new quiz as "re-quiz required" — workers see a banner but old pass still stands for compliance gap detection. |
| 5 | Quiz trigger UX | **Scroll-triggered bottom sheet (primary) + persistent status chip in SOP header** | Bottom sheet slides up from below fold after 80% scroll — doesn't interrupt reading, feels native on mobile. Header chip always shows status and lets workers re-take any time. See UI spec below. |
| 6 | Export | **Mandatory, own section in exports UI** — CSV + JSON, separate from SOP bundle | OSHA audit trail. Includes all attempts (not just latest pass), questions text, answer chosen, language, version at time of attempt. 3-year record retention design. |

---

## OSHA Compliance Notes

- **No mandated pass score.** 29 CFR 1910.178 (forklifts), 1910.132 (PPE), 1910.1200 (HAZCOM) all require training and evaluation of understanding — none specify a percentage.
- **Records required:** Who was trained, date, content, method. Keep for **3 years** (General Industry). Comprehension events are immutable once written — no hard delete, only soft archive.
- **What OpsFluency provides:** Timestamped pass/fail record with SOP version, question text, answer chosen, language, and employee ID. This exceeds OSHA's documentation requirements and covers ISO 9001 / ISO 45001 competency evidence needs.
- **What OpsFluency does NOT provide (and does not need to):** Proctor identity verification, time-to-complete measurement, or anti-gaming guarantees. A wall-mounted QR + warehouse floor environment is inherently observable by supervisors.

---

## Schema & Migrations

### New tables

- [ ] **`20260527_sop_quizzes.sql`** — quiz questions cache, one row per SOP
  ```sql
  CREATE TABLE sop_quizzes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sop_id          UUID NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    questions       JSONB NOT NULL,
      -- [{ q_en, q_es, options_en[4], options_es[4], correct_index: 0-3 }]
    question_count  SMALLINT NOT NULL DEFAULT 3,
    model           TEXT NOT NULL,          -- which Haiku call generated this
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sop_content_hash TEXT NOT NULL,         -- SHA-256 of content_en at generation time
    UNIQUE (sop_id)                         -- one active quiz per SOP
  );
  -- RLS: company isolation + is_super_admin()
  -- Workers can SELECT their own company's quizzes (needed to serve quiz UI)
  -- Managers can SELECT all quizzes for their company
  -- Only server-side (admin client) INSERTs/UPDATEs
  ```

- [ ] **`20260527_sop_comprehension_events.sql`** — one row per quiz attempt
  ```sql
  CREATE TABLE sop_comprehension_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sop_id          UUID NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id     UUID REFERENCES employees(id) ON DELETE SET NULL,
    clerk_user_id   TEXT NOT NULL,          -- redundant with employee_id but survives employee row deletion
    quiz_id         UUID NOT NULL REFERENCES sop_quizzes(id),
    sop_version_number SMALLINT NOT NULL,   -- version at time of attempt (from sop_versions)
    language        TEXT NOT NULL CHECK (language IN ('en', 'es')),
    questions_snapshot JSONB NOT NULL,      -- full question text at time of attempt (immutable audit record)
    answers         JSONB NOT NULL,         -- [{ question_index, selected_index }]
    score           SMALLINT NOT NULL,      -- 0–100 (integer percentage)
    passed          BOOLEAN NOT NULL,
    skipped         BOOLEAN NOT NULL DEFAULT FALSE,
    attempt_number  SMALLINT NOT NULL DEFAULT 1,  -- 1-based within same quiz_id + employee
    completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  -- RLS:
  --   Workers: INSERT own rows (company_id = requesting_company_id(), clerk_user_id = auth.jwt()->>'sub')
  --   Workers: SELECT own rows
  --   Managers: SELECT all rows for their company
  --   No UPDATE or DELETE for anyone — immutable audit trail
  --   is_super_admin() in both USING and WITH CHECK per architecture rules
  -- Index: (sop_id, company_id) for manager pass-rate queries
  -- Index: (employee_id, company_id) for employee profile queries
  -- Index: (company_id, completed_at DESC) for export queries
  ```

### Department quiz settings

- [ ] **`20260527_department_quiz_settings.sql`** — configurable thresholds per department
  ```sql
  ALTER TABLE departments
    ADD COLUMN quiz_pass_threshold_pct SMALLINT NOT NULL DEFAULT 67
      CHECK (quiz_pass_threshold_pct BETWEEN 0 AND 100),
    ADD COLUMN quiz_max_attempts       SMALLINT NOT NULL DEFAULT 2
      CHECK (quiz_max_attempts BETWEEN 1 AND 10),  -- 10 = effectively unlimited
    ADD COLUMN quiz_requiz_on_update   BOOLEAN  NOT NULL DEFAULT FALSE;
    -- When TRUE: manager pushing a new quiz version requires employees to re-attempt
    -- When FALSE: new quiz available but old pass record still counts
  ```

---

## Quiz Generation Pipeline

- [ ] **`lib/ai/quiz-generator.ts`** — Haiku call: bilingual Markdown → 3 bilingual questions
  - Input: `{ content_en, content_es, template, company_id, sop_id }`
  - System prompt (cached): instructs Haiku to generate exactly 3 factual questions from the document. Each question must test a concrete step, safety requirement, or key fact. Options must be plausible (wrong answers drawn from the document, not obviously silly). All in JSON only.
  - User message: inject `content_en` + `content_es` (both, so Haiku can construct accurate bilingual options)
  - Output shape: `{ "questions": [{ "q_en", "q_es", "options_en"[4], "options_es"[4], "correct_index": 0|1|2|3 }] }`
  - `max_tokens: 1500` (3 questions × 4 options × bilingual = large but bounded)
  - Logged to `ai_call_log` (model: `claude-haiku-4-5-20251001`)
  - On parse failure: log raw first 2KB, return `{ code: 'AI_PARSE_FAILURE', retry_allowed: true }`

- [ ] **`lib/ai/quiz-generator.ts`** — `generateQuizForSop(sopId, companyId)` orchestrator
  - Fetch current published version's `content_en` + `content_es`
  - Compute `sha256(content_en)` — skip generation if `sop_quizzes.sop_content_hash` matches (content unchanged)
  - Call Haiku
  - Upsert `sop_quizzes` row (insert or update on `sop_id` conflict)
  - Return quiz row

- [ ] Wire quiz generation into `runTranslation` server action (after status → `published`)
  - Generate quiz after QR code is created (non-blocking: `void generateQuizForSop(...)`)
  - Failure must not block publish — quiz is a best-effort enhancement

- [ ] Wire quiz regeneration into `saveSpanishEdit` server action
  - If `content_en` hash has changed since last quiz → regenerate
  - If manager saves Spanish only (content_en unchanged) → skip regeneration

---

## Worker PWA — Quiz UI/UX

### Scroll-trigger system
- [ ] `app/app/sop/[id]/_components/QuizScrollTrigger.tsx` — client component
  - Uses `IntersectionObserver` on a sentinel element placed at 80% of the SOP content height
  - Fires once per session per SOP (stored in component state — does not persist across page reloads)
  - If worker already passed this quiz (check via pre-fetched `hasPassed` prop): no trigger
  - If worker has hit `max_attempts` for this quiz: no trigger; show "see your manager" state instead

### SOP header status chip
- [ ] Persistent chip in SOP viewer header (always visible, even before scroll)
  - States:
    - `no-attempt` (neutral): "Take Quiz" button → opens quiz modal immediately
    - `passed` (green): "✓ Quiz Passed" — tapping shows score + date
    - `failed-retries-remain` (amber): "Retry Quiz" → opens quiz modal
    - `failed-no-retries` (red): "See Your Manager" — no modal, link to HR contacts
    - `no-quiz` (hidden): SOP has no quiz yet (generation pending or failed)
  - Chip must be ≥44px touch target, visible at top of page without scrolling

### Bottom sheet quiz modal
- [ ] `app/app/sop/[id]/_components/QuizModal.tsx` — client component (bottom sheet)
  - Slides up from bottom (translate-y animation, 300ms ease-out)
  - Backdrop: dark overlay, tap outside = dismiss (logs as skipped)
  - Content structure:
    - Header: "Quick Check" (EN) / "Verificación Rápida" (ES) + "Question N of 3" progress
    - Progress dots: `● ● ○` (filled = answered, empty = remaining)
    - Question text (large, 18px min, bilingual in worker's `preferred_language`)
    - 4 option buttons (full-width, 56px height, warehouse-safe tap target)
    - Options: tap selects, immediate visual feedback BEFORE submitting (highlight selected)
    - "Submit Answer" button appears after selection (prevents accidental tap)
  - Per-question feedback:
    - Correct: option turns emerald green, brief checkmark icon, 800ms delay, auto-advance
    - Wrong: option turns red, correct answer revealed in green, 1200ms delay, auto-advance
  - Final result screen (replaces question content):
    - **Pass:** Large green checkmark, score ("3/3 — 100%"), "Great work!" (EN) / "¡Buen trabajo!" (ES), confetti burst (CSS animation, respects `prefers-reduced-motion`), "Done" button
    - **Fail with retries remaining:** Score shown, "Try again?" button, "Skip for now" link
    - **Fail no retries:** Score shown, "Talk to your manager" CTA linking to HR contacts
  - Accessibility:
    - `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
    - Focus trap inside modal while open
    - `lang` attribute switches to `"es"` when `preferred_language = 'es'`
    - Options use `<button>` not `<div>` — keyboard navigable
    - No timer, no countdown

### Server Action: submit quiz result
- [ ] `app/app/sop/_actions/submitQuizResult` server action
  - Auth: employee Clerk session → `getCompanyContext()` (employee role)
  - Input: `{ quiz_id, sop_id, answers[{ question_index, selected_index }], language }`
  - Validate: quiz_id exists and belongs to same company
  - Fetch `sop_quizzes.questions` to compute score server-side (never trust client score)
  - Check attempt count: if `attempt_number > dept.quiz_max_attempts` → return `{ ok: false, error: { code: 'MAX_ATTEMPTS_REACHED' } }`
  - Score = `(correct_count / total_questions * 100)` rounded to nearest integer
  - Pass = `score >= dept.quiz_pass_threshold_pct`
  - Insert `sop_comprehension_events` row (with `questions_snapshot` = full question JSON at time of attempt)
  - Return `{ ok: true, data: { score, passed, attempt_number, correct_count, total_questions } }`

### Server Action: skip quiz
- [ ] `app/app/sop/_actions/skipQuiz` server action
  - Inserts `sop_comprehension_events` row with `skipped: true`, `score: 0`, `passed: false`
  - Same auth and company-scope guard

---

## Manager Dashboard

### Department settings — quiz threshold
- [ ] **`/dashboard/departments/[id]`** — add "Quiz settings" section to department detail/edit page
  - Pass threshold selector: "2 of 3 (67%)" / "3 of 3 (100%)" radio group
    - Label clearly: "Employees need [X] correct answers to pass"
    - Tooltip: "OSHA does not mandate a specific score. 2 of 3 is the industry-standard floor for most procedures. Consider 3 of 3 for safety-critical SOPs."
  - Max attempts: number input (1–10, label: "Attempts before 'see your manager'"; 10 = unlimited)
  - Re-quiz on update toggle: "Require re-quiz when procedure is updated"
  - Server Action: `updateDepartmentQuizSettings`

### SOP detail page — Comprehension tab
- [ ] New "Comprehension" tab on `/dashboard/sops/[id]`
  - Only shown if SOP is `published` and a quiz exists
  - **Pass rate summary:** "N / M employees passed (X%)" with color-coded gauge (green ≥80%, amber 60–79%, red <60%)
  - **Employees who haven't attempted:** count + expandable list of names
  - **Attempts table:** columns: Employee | Attempts | Best Score | Passed | Language | Last Attempt
    - Sorted by: not-passed first, then by last attempt date desc
    - Pagination: 25 rows per page
  - **Push new quiz button:** "Regenerate Quiz" — triggers `generateQuizForSop` on demand
    - If `quiz_requiz_on_update: true` for this department: also shows "Require re-attempt" toggle

### Employee profile — comprehension history
- [ ] On employee detail view (within employees tab or as a side panel):
  - Table: SOP Title | Version | Score | Passed | Language | Date
  - Filter by: passed / failed / skipped
  - Export button (triggers individual employee comprehension export)

### Announcements / nudge system (future hook)
- [ ] *(Defer to Phase 2C integration)* — SOP Health Score will incorporate comprehension pass rate; nudges will surface low-pass-rate SOPs automatically

---

## Export System — Comprehension Records

> Separate export section, not bundled with SOP export. Robust and OSHA audit-ready.

### New export type on `/dashboard/org-settings` → Exports tab
- [ ] Add "Comprehension Records" as its own section in the exports UI (below existing SOP bundle section)
- [ ] Export options presented to manager:
  - **Date range:** from / to date pickers (default: last 90 days; max: all time)
  - **SOP filter:** all SOPs, or select specific SOPs from a searchable list
  - **Department filter:** all departments, or specific departments
  - **Include skipped attempts:** checkbox (default: off)
  - **Format:** CSV (default) or JSON

### CSV export schema
```
attempt_id, sop_id, sop_title, sop_version, employee_name, employee_email,
department_name, language, attempt_number, score_pct, passed,
question_1_text, question_1_answer_chosen, question_1_correct,
question_2_text, question_2_answer_chosen, question_2_correct,
question_3_text, question_3_answer_chosen, question_3_correct,
completed_at, skipped
```
- One row per attempt (not per employee — auditors need all attempts, not just the final pass)
- Questions/answers use the `questions_snapshot` stored at attempt time (immutable — reflects exact wording worker saw)
- Employee name/email joined from `employees` + `company_members` tables
- Null-safe: deleted employees show `[Deleted Employee]` placeholder

### JSON export schema
```json
{
  "export_metadata": { "company_id", "exported_at", "date_range", "total_attempts", "total_passes" },
  "attempts": [{ ...all CSV fields as JSON keys... }]
}
```

### Server-side export logic
- [ ] New export type `'comprehension'` added to the existing export system (`app/api/exports/[format]/route.ts` or new Server Action)
- [ ] Export query: `sop_comprehension_events` joined with `sops`, `sop_quizzes`, `employees`, `company_members`, `departments` — all filtered by `company_id` (RLS + explicit filter)
- [ ] Write `data_export_events` audit row (same pattern as existing SOP bundle exports)
- [ ] Rate-limit: same rate limit as existing exports (prevent abuse)
- [ ] File naming: `opsfluency-comprehension-{company_slug}-{date}.csv`
- [ ] Max export row count: 100,000 rows per export request; paginated streaming for larger datasets (Vercel Edge 10s timeout consideration)
- [ ] Export is served as a download (not stored in Supabase Storage — too sensitive for a public/private bucket)

### Retention / compliance design
- [ ] `sop_comprehension_events` has NO hard-delete path for regular managers — records are immutable
- [ ] Super admin can hard-delete via platform console (same pattern as `deleteAiHistory`) — must log to `super_admin_events`
- [ ] 3-year retention guidance surfaced in export UI: "OSHA General Industry requires training records for 3 years. This export covers [date range]."
- [ ] `completed_at` is indexed for range queries; large date-range exports use cursor pagination

---

## Re-quiz Flow (on version update)

- [ ] When `runTranslation` completes (new publish after retranslation):
  - Auto-regenerate quiz (hash check: only if `content_en` changed)
  - If `departments.quiz_requiz_on_update = TRUE` for any dept this SOP targets:
    - Insert rows into a new `sop_requiz_assignments` table linking the new quiz to all employees in those depts who previously passed
    - Worker PWA: SOP card shows an amber "Updated — re-quiz" badge until they re-attempt
    - Manager dashboard: shows count of employees needing re-quiz per SOP
  - If `quiz_requiz_on_update = FALSE` (default):
    - New quiz silently replaces old one for new attempters
    - Existing pass records still count for compliance
    - Header chip: "✓ Quiz Passed (v1)" subtle indicator that a newer quiz exists

- [ ] **`sop_requiz_assignments`** table (small, only exists when re-quiz is required)
  ```sql
  CREATE TABLE sop_requiz_assignments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sop_id        UUID NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
    company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    quiz_id       UUID NOT NULL REFERENCES sop_quizzes(id),  -- the NEW quiz
    employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at  TIMESTAMPTZ,       -- null until worker passes or skips
    UNIQUE (quiz_id, employee_id)
  );
  ```

---

## Roadmap Integration

When each section below is complete, check the corresponding item in `docs/dev/roadmap.md` Phase 2B.

- [ ] Schema migrations shipped (3 new tables + departments columns)
- [ ] `lib/ai/quiz-generator.ts` + Haiku call
- [ ] Quiz generation wired into publish pipeline + retranslation
- [ ] Worker PWA: scroll trigger + bottom sheet modal + per-question feedback + result screen
- [ ] Worker PWA: SOP header status chip (5 states)
- [ ] Server Actions: `submitQuizResult` + `skipQuiz`
- [ ] Manager: department quiz settings UI (threshold + retries + re-quiz toggle)
- [ ] Manager: SOP detail Comprehension tab (pass rate + employee table + regenerate button)
- [ ] Manager: employee profile comprehension history
- [ ] Export: comprehension records own section in exports UI
- [ ] Export: CSV + JSON download with full attempt snapshot
- [ ] Export: audit row written to `data_export_events`
- [ ] Re-quiz flow: `sop_requiz_assignments` table + worker badge + manager count widget
- [ ] Roadmap 2B checkboxes updated in `docs/dev/roadmap.md`

---

## Open Items / Deferred

- **Score display format:** Show "2/3" or "67%"? Recommendation: show both — "2 out of 3 (67%)"
- **Quiz available offline?** Service worker caches SOP content — should quiz questions be cached too? Yes — cache the quiz JSON alongside the SOP content. Offline attempts should queue the result and submit when reconnected.
- **Analytics integration with SOP Health Score (Phase 2C):** Pass rate feeds directly into health score formula. No additional work needed at quiz build time — `sop_comprehension_events` is the data source.
- **Voice-read quiz questions (Phase 2F integration):** When voice playback is built, extend it to read quiz questions aloud after SOP content finishes playing.
- **Multi-language quiz generation beyond Spanish (Phase 3):** No changes to quiz-generator.ts needed — just pass the appropriate target language. The bilingual JSONB schema already supports N-language options.
