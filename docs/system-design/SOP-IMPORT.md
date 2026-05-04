# SOP Import Pipeline — System Design

## Overview

The SOP import pipeline converts a raw uploaded document (PDF, DOCX, DOC, TXT, or image) into a bilingual, QR-accessible SOP. It is a strictly sequential, manager-gated pipeline — no step runs automatically without explicit action.

```
Upload → Convert → Flag terms → Manager review → Translate → Publish → QR
```

Each stage maps to a `sops.status` value. Transitions are one-way and race-safe (each DB update checks the expected `from` status before writing).

---

## Status Lifecycle

```
draft
  └─→ pending_terms          Sonnet flagged site-specific terms; manager must define them
        └─→ pending_translation  All terms resolved; Google Translate can run
              └─→ published        Spanish approved; QR code live
                    └─→ archived        Manager-initiated; QR returns HTTP 410
```

If Sonnet flags zero terms, the pipeline auto-advances `draft → pending_terms → pending_translation` in a single action so the manager skips the terms gate.

---

## Stage 1 — Upload (`createSopFromUpload`)

**Entry point:** Server Action  
**Auth:** `getCompanyContext('manager')`

1. Validate file: MIME type must be in `SOP_UPLOAD_MIME_TYPES`, size ≤ 10 MB.
2. Verify `department_id` belongs to the company.
3. Enforce audience scope (non-HR managers can only target their own department).
4. Insert `sops` row (`status = 'draft'`, `template = null`).
5. Upload file to `sop-uploads` bucket at `${company_id}/${sop_id}/v${n}/${filename}`.
6. Insert `sop_versions` v1 row with `original_file_url`; `content_en` and `content_es` are null.

**Accepted MIME types:**

| Format | MIME type |
|---|---|
| PDF | `application/pdf` |
| DOCX | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| DOC (legacy) | `application/msword` |
| Plain text | `text/plain` |
| JPEG | `image/jpeg` |
| PNG | `image/png` |
| HEIF | `image/heif` |

---

## Stage 2 — Conversion (`POST /api/sops/[id]/convert`)

**Entry point:** SSE streaming API route (`maxDuration = 300`)  
**Auth:** `getCompanyContext('manager')` before stream opens  
**Fallback:** `runConversion` server action (identical logic, no streaming)

The manager clicks **Run conversion**. The browser opens a streaming `fetch` to the SSE route. The server emits real-time events; the UI shows accurate per-chunk progress instead of a synthetic timer.

### SSE events

| Event | Payload | When |
|---|---|---|
| `chunk_start` | `{ chunk, total, label }` | Before each Sonnet call |
| `chunk_done` | `{ chunk, total }` | After each Sonnet call completes |
| `flagging_start` | `{ chunks_total }` | Before Call 2 (glossary flagging) |
| `done` | `{ status, flagged_count }` | Pipeline finished, DB written |
| `error` | `{ code, message, retry_allowed, … }` | Any failure |

If the manager navigates away, the browser fires `AbortController`, the server detects the cancelled signal, and stops mid-conversion. Conversion is idempotent — retrying overwrites `content_en`.

---

## Stage 2a — Document Routing

The pipeline dispatches on MIME type before calling Sonnet:

```
PDF
  ├─ extractPdfText()  (pdf-parse@1.1.1, dynamic import)
  │    ├─ extracted text ≥ 500 chars  →  Text path (typed PDF)
  │    └─ extracted text < 500 chars  →  Vision path (scanned/image PDF)
  │
DOCX / DOC
  ├─ extractWordText()  (mammoth, dynamic import)
  │    ├─ extracted text ≥ 200 chars  →  Text path
  │    └─ extracted text < 200 chars  →  Text path with raw utf-8 fallback
  │
TXT
  └─ utf-8 decode  →  Text path
  │
JPG / PNG / HEIF
  └─ Vision path  (Sonnet image block, single call)
```

**Why dynamic imports?**  
`pdfjs-dist` (the engine inside `pdf-parse`) references browser globals (`DOMMatrix`, `ImageData`) at module evaluation time. A static import would crash the Vercel Node.js runtime on every page load, even requests that never touch a PDF. Dynamic import (`await import(...)`) defers evaluation until `extractPdfText()` is actually called.

---

## Stage 2b — Proactive Chunking (Text Path)

### Thresholds

| Constant | Value | Purpose |
|---|---|---|
| `PROACTIVE_CHUNK_CHARS` | 20,000 | Split text before calling Sonnet |
| `CONVERSION_TEXT_CHUNK_MAX_CHARS` | 60,000 | Reactive fallback if a proactive chunk itself triggers `AI_TRUNCATED` |
| `FLAGGING_CHUNK_MAX_CHARS` | 8,000 | Max chars per flagging sub-call (Call 2) |

### Decision tree

```
Extracted text length
  │
  ├─ ≤ 20,000 chars  →  Single Call 1 (one Sonnet call)
  │
  └─ > 20,000 chars  →  Split proactively, N chunks
                         (each chunk ≤ 20,000 chars)
```

### Approximate page counts at 20,000-char threshold

A dense A4/Letter page of body text is roughly 3,000–4,000 chars.

| Pages | Approx chars | Chunks |
|---|---|---|
| 1–3 | ~9,000–12,000 | 1 (no split) |
| 4–5 | ~12,000–20,000 | 1–2 |
| 6–10 | ~20,000–35,000 | 2–3 |
| 15+ | ~45,000+ | 3–4 |

### Split priority inside `splitTextProactively()`

1. **H1/H2 heading boundaries** (`^#{1,2} `) — keeps logical sections together
2. **H3/H4 headings** — secondary split if any chunk is still oversized
3. **Paragraph breaks** (`\n\n+`) — last resort

### Why proactive instead of reactive?

The old approach waited for Sonnet to return `AI_TRUNCATED` before splitting. Problems:
- The first attempt always ran, wasting 60–120s before the retry
- PDFs could not be chunked at all (the base64 document block can't be split)
- The UI had no real progress signal — only a synthetic timer

Proactive chunking at 20,000 chars produces chunks of ~4,000–6,000 output tokens each. At Sonnet's throughput, each chunk completes in ~25–35s, vs 90–120s for a full 5-page document in one pass. The total wall time is similar for sequential calls, but each chunk completion is a concrete milestone the UI can report.

### Reactive fallback

If a proactive chunk itself triggers `AI_TRUNCATED` (shouldn't happen at 20,000 chars, but guards against extremely dense content), the pipeline re-splits at the 60,000-char threshold before surfacing an error to the manager.

---

## Stage 2c — Two-Call Sonnet Pipeline

Each chunk (or the full document for single-call paths) runs two Sonnet calls.

### Call 1 — Document → Markdown

| Property | Value |
|---|---|
| Model | `claude-sonnet-4-6` |
| Max output tokens | 16,384 |
| System prompt | Cached (`cache_control: ephemeral`) |
| Timeout | 180s via `AbortController` |
| Retry | 1× on 429 / 5xx, jittered 500–1500ms |

Output: `{ "markdown": "..." }` JSON only, no fences.

Rules enforced by the prompt:
- Headings, numbered steps, bullet lists, tables preserved
- Warning/Caution/Note callouts → `> **Warning:**` blockquotes
- Page numbers, headers, footers, revision metadata stripped
- Short sentences — workers read on phones in gloves

### Call 2 — Markdown + Glossary → Flagged Terms

| Property | Value |
|---|---|
| Model | `claude-sonnet-4-6` |
| Max output tokens | 8,192 |
| System prompt | Cached, includes full company glossary |
| Input | Compact Markdown from Call 1 (not the raw document) |

Output: `{ "flagged_terms": [{ term, reason, suggested_definition_en, suggested_term_es }] }`

Call 2 runs on the merged Markdown across all chunks. It has its own chunking at 8,000 chars (heading boundaries) so large documents don't hit the output cap here either.

**Terms already in the company glossary are never flagged.** The full glossary is injected into the system prompt so Sonnet can skip known terms and surface only net-new ones.

### After both calls

- `sop_versions.content_en` and `flagged_terms` written
- `recommendTemplate()` (Haiku) fires in parallel — fire-safe, failure ignored
- Status transitions: `draft → pending_terms` (always), then auto-advance to `pending_translation` if `flagged_terms` is empty

---

## Stage 3 — Terms Gate (`defineFlaggedTerms`)

**Entry point:** Server Action  
**Blocks:** Translation cannot start until all terms are resolved

The manager sees each flagged term with Sonnet's suggested definition and Spanish equivalent. Per-term resolution options:

| Resolution | Effect |
|---|---|
| `use_new` | Insert (or case-insensitive upsert) into `glossary_terms` |
| `use_existing` | Keep the existing glossary entry, discard Sonnet's suggestion |
| `skip` | Exclude from glossary; translator handles it without a gloss |

After submission: `flagged_terms` cleared on `sop_versions`, status → `pending_translation`.

---

## Stage 4 — Translation (`runTranslation`)

**Entry point:** Server Action  
**Model:** Google Cloud Translation API (never Claude — see note below)

1. Load `content_en` from latest version.
2. Fetch full company glossary.
3. Call `translateMarkdownStructured()`:
   - Parses Markdown as mdast
   - Translates text leaf nodes only (structure preserved)
   - Substitutes glossary terms with `XGLO` placeholders before sending to Google; restores them after
4. Write `content_es`, set `published_at`, clear `needs_retranslation`.
5. Status → `published`.
6. Find or create a permanent `qr_codes` row for this SOP.

**Why Google Translate and not Claude?**  
Translation is a high-frequency, cost-sensitive operation. Google Cloud Translation with glossary injection is purpose-built, significantly cheaper per character, and produces consistent results. Claude's strength is reasoning and structure — used for conversion and flagging where those matter. Using Claude for translation would be ~10× the cost for no quality gain on straightforward bilingual text.

---

## Re-translation on English edits

When a manager edits the English side of a `published` SOP:
- A new `sop_versions` row is created with an incremented `version_number`
- `needs_retranslation = true` is set
- `sops.status` stays `published` — workers continue seeing the last approved Spanish
- The manager is shown a banner prompting them to re-run translation and approve the new Spanish

`needs_retranslation` is only cleared when the manager approves the re-translated Spanish.

---

## Cost Attribution

Every Sonnet call writes one row to `ai_call_log`:

```
model, input_units, output_units, unit_kind ('token'),
cache_write_tokens, cache_read_tokens,
sop_id, company_id, duration_ms, created_at
```

Google Translate calls write rows with `unit_kind = 'character'`. This gives the AI usage tab accurate per-SOP, per-model cost breakdown and early warning for cost runaway.

---

## Key Files

| File | Role |
|---|---|
| `app/dashboard/sops/_components/UploadSopClient.tsx` | Upload dropzone, audience picker, base64 encoding |
| `app/dashboard/sops/_actions.ts` | `createSopFromUpload`, `runConversion` (fallback), `defineFlaggedTerms`, `runTranslation` |
| `app/api/sops/[id]/convert/route.ts` | SSE streaming conversion route |
| `lib/ai/sop-conversion.ts` | Two-call Sonnet pipeline, proactive chunking, `onChunkProgress` callback |
| `lib/ai/pdf-extraction.ts` | pdf-parse wrapper (dynamic import, typed PDF only) |
| `lib/ai/docx-extraction.ts` | mammoth wrapper for DOCX/DOC extraction |
| `lib/ai/sonnet.ts` | All Claude API calls — timeout, retry, caching, cost logging |
| `lib/translation/structured.ts` | mdast-preserving Google Translate with glossary injection |
| `lib/types/sop.ts` | Status enum, MIME type list, `isWordMime`, `isPdfMime`, `isImageMime` |
| `app/dashboard/sops/[id]/_components/RunConversionButton.tsx` | SSE fetch consumer, progress state |
| `app/dashboard/sops/[id]/_components/JobFeedback.tsx` | `ConversionProgress` (section pills, ETA), `JobProgress` (translation), `JobError` |
