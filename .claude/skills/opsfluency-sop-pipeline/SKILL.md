---
name: opsfluency-sop-pipeline
description: The SOP import, conversion, glossary flagging, translation, and publishing pipeline for OpsFluency. Use whenever writing, reviewing, or modifying any code that handles SOP file uploads, AI conversion to Markdown, glossary term flagging, Spanish translation, SOP version management, or the publish and QR code generation flow. Also use for anything involving the SOP lifecycle states (draft, active, expired, archived) or the sops, sop_versions, glossary_terms, or qr_codes Supabase tables.
---

# OpsFluency SOP Pipeline

This skill enforces the rules for OpsFluency's core product capability: taking an existing SOP document in any format, converting it with AI, flagging site-specific terms for manager review, translating it to Spanish using company glossary context, and publishing a bilingual version with a QR code.

The pipeline is the heart of OpsFluency. Every rule below exists to protect translation quality and worker dignity. Shortcuts here break the product's core value promise.

## The Non-Negotiable Pipeline Order

SOPs move through these stages in this exact order. No stage can start until the previous stage is complete. This is a state machine, not a suggestion.

1. Upload (PDF, DOCX, or TXT file saved to Supabase Storage)
2. AI conversion to structured Markdown (Claude Sonnet)
3. Glossary term flagging (Claude Sonnet identifies site-specific terms AND suggests definitions and Spanish translations for each)
4. Manager accepts, edits, or overrides every flagged term (HARD GATE, see below)
5. Manager reviews and optionally edits the Markdown
6. Manager selects the content template for this SOP (step-by-step, reference, safety checklist, or onboarding)
7. System translates the SOP to Spanish using the company glossary (Google Cloud Translation)
8. Manager approves the Spanish translation
9. Publish (SOP becomes active, QR code generated)

If code is being written that lets a user skip a stage, that code is wrong. Ask the user before proceeding.

## Content Template vs Brand Template

OpsFluency has two separate template concepts. Do not confuse them.

**Content template** is chosen per SOP at step 6 of the pipeline. It controls the structural layout of that specific document. The four options are:

- Step-by-Step Procedure (equipment operation, numbered tasks)
- Reference Document (policies, multi-section guides)
- Safety Checklist (lockout/tagout, PPE, hazard procedures)
- Onboarding Document (new hire welcome, orientation)

Workers see a different layout per SOP based on the content template. A safety checklist must render with checkboxes and hazard callouts. A reference document must render with a table of contents and collapsible sections. Never force content into the wrong template type.

**Brand template** is set once per organization and applies to every SOP that company publishes. It controls visual branding (logo, primary color, footer text). The detailed design of brand template fields and the signup flow are deferred until those screens are built. For now, assume the following exist on the `companies` table: `brand_primary_color`, `brand_logo_url`, `brand_footer_text`.

## The Glossary Hard Gate

This is the most important rule in this skill.

Translation cannot begin until every flagged glossary term has been accepted, edited, or overridden by the manager. The database enforces this through the `translation_status` field on `sop_versions`, which must stay at `pending` until every flagged term in the SOP has a corresponding row in `glossary_terms` with non-null `definition_en` and non-null `term_es`.

When implementing the UI for this:

- Show the list of flagged terms with Sonnet's suggested English definition and Spanish translation visible for each
- Provide three actions per term: accept (use Sonnet's suggestion as-is), edit (modify before saving), override (replace with manager's own text)
- Visually flag any term that has not yet been acted on by the manager
- Disable the "Translate to Spanish" button until every flagged term has been acted on
- The disabled state must include hover text explaining why, not just appear broken
- When a term is accepted or edited, save it immediately to the `glossary_terms` table with `company_id` scoping
- Never fall back to generic translation if the glossary gate is not passed

## Why the Glossary Matters

The product is called OpsFluency because operations speak the same language. Every SOP, announcement, and HR doc at a given company uses the same internal terminology, consistently, across English and Spanish. The glossary is what makes that true. Once a term is defined at a company, it stays defined forever, and every future translation uses it.

This is the single feature that separates OpsFluency from generic translation tools. Protect it.

## Supported Upload Formats

MVP supports exactly three formats: PDF, DOCX, and TXT. Do not add support for other formats without explicit user approval. Reject all other uploads with a clear error message that lists the supported formats.

File size limit: 10MB. Files larger than this should be rejected with a friendly error suggesting the user compress or split the file. Revisit this limit after the first 10 customers.

## Claude Sonnet Conversion Rules

The conversion from uploaded file to structured Markdown uses Claude Sonnet, not Haiku. Quality matters more than cost here because this step runs once per SOP.

The conversion prompt must:

- Instruct Sonnet to preserve the original document's structure (headings, lists, warnings, numbered steps)
- Instruct Sonnet to use standard SOP formatting conventions (clear hierarchy, warnings visually prominent)
- Instruct Sonnet to output clean Markdown, no HTML
- Pass the full company glossary (all existing terms) as context so Sonnet recognizes previously-defined terms and does not re-flag them
- Instruct Sonnet to flag site-specific terms AND suggest an English definition and a Spanish translation for each
- Return flagged terms as a structured JSON block at the end of the Markdown output

## Glossary Flagging Rules

Sonnet must flag any term in the SOP that meets any of these criteria:

- Appears to be a company-specific nickname or abbreviation
- Has an industry-specific meaning that differs from common usage
- Is a proper noun for a location, tool, process, or system name
- Would translate incorrectly using generic AI translation

Never flag common English words or standard industry terminology that translates reliably. Never re-flag a term that already exists in the company glossary.

For every flagged term, Sonnet provides:

- The exact term as it appears in the SOP
- A suggested English definition (one sentence, plain language)
- A suggested Spanish translation
- Context (the sentence where the term appeared, so the manager can verify)

The manager's role is to accept, edit, or override each suggestion. Sonnet makes the manager's job fast. The manager stays in control.

## Translation Rules

Translation uses Google Cloud Translation API, not Claude. Google's translation API is purpose-built for this, cheaper, and supports glossary injection natively.

Every translation call must:

- Include the full company glossary as translation overrides
- Translate from English to Spanish (es) for MVP
- Preserve all Markdown formatting (headings, lists, bold, links)
- Set `translation_status` to `ready` when complete, not `approved`

Manager approval is a separate step. Never auto-approve a translation.

## SOP Lifecycle State Rules

The `status` field on the `sops` table has exactly four values:

| Status | Meaning | Worker Visible |
|---|---|---|
| draft | Created but not published | No |
| active | Published and current | Yes |
| expired | Past expiration date | No |
| archived | Manually retired | No |

State transitions allowed:

- draft -> active (publish)
- active -> expired (automatic, when `expires_at` is past)
- active -> archived (manual)
- expired -> active (manager republishes)
- archived -> active is NOT allowed (require creating a new SOP)

## Version Management Rules

Every publish creates a new row in `sop_versions`, never overwrites. The `version_number` increments by 1 per SOP.

When a manager updates the English master of an active SOP:

- Create a new `sop_versions` row with the updated `content_en`
- Set `content_es` to null and `translation_status` to `pending`
- Re-run the translation pipeline with the current glossary
- The previous version remains in the database for history but is not shown to workers
- Workers always see the version with the most recent `published_at` where `translation_status = 'approved'`

## QR Code Rules

QR codes are generated once per SOP, never per version. The `qr_codes` table has one row per SOP. The QR URL points to a worker-facing route that looks up the current active version at scan time.

QR codes survive SOP updates and version bumps. They break only when the SOP is archived, at which point scanning shows a friendly "this procedure is no longer available" message rather than a 404.

## Expiration Rules

Optional per SOP, set at publish time via `expires_at`.

- Dashboard shows a notification 14 days before expiration
- Expired SOPs are hidden from worker-facing search and QR scan results
- Managers can still view expired SOPs and republish them
- Expiration is a background job, not a trigger on read

## Things to Always Do

- Scope every query by `company_id` from the `company_members` table, not from Clerk
- Use Supabase Row Level Security policies as a second line of defense
- Log every AI call (Claude, Google Translation) with token counts for cost tracking
- Show loading states during AI conversion (takes 10 to 30 seconds for typical SOPs)
- Save uploaded files to Supabase Storage with org-scoped paths

## Things to Never Do

- Never skip the glossary gate, even in dev or test
- Never use Haiku for the conversion step (quality matters more than cost)
- Never auto-approve a Spanish translation
- Never let a worker see an unapproved translation
- Never expose `sop_versions` rows directly to workers (filter through the `status = active` and `translation_status = approved` join)
- Never hardcode the supported upload formats or file size limits in multiple places (centralize in `lib/sop/constants.ts`)
- Never apply a content template to an SOP whose structure does not match it (do not force a safety checklist into a reference document layout)
