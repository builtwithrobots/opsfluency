'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { AuthError, getCompanyContext } from '@/lib/auth/company-context';
import { getSuperAdminContext } from '@/lib/auth/super-admin-context';
import { getAdminClient } from '@/lib/supabase/admin';
import {
  convertSopFromImage,
  convertSopFromPdf,
  convertSopFromText,
  type FlaggedTerm,
  type SopConversionResult,
} from '@/lib/ai/sop-conversion';
import { recommendTemplate } from '@/lib/ai/template-recommender';
import type { GlossaryRow } from '@/lib/types/glossary';
// `translateMarkdown` (flat-text path) is kept exported for the glossary
// suggest-translation feature; runTranslation switched to the structured
// path below to preserve mdast scaffolding.
import { translateMarkdownStructured } from '@/lib/translation/structured';
import { createQrCode } from '@/lib/qr/generate';
import { isWithinCreatorScope } from '@/lib/qr/audience';
import { getCreatorScope } from '@/lib/qr/creator-scope';
import {
  ALLOWED_SOP_TRANSITIONS,
  SOP_UPLOADS_BUCKET,
  SOP_UPLOAD_MAX_BYTES,
  SOP_UPLOAD_MIME_TYPES,
  SOP_TEMPLATE,
  WORKER_LANGUAGES,
  isImageMime,
  isPdfMime,
  type SopStatus,
  type SopTemplate,
} from '@/lib/types/sop';

type ActionResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: { code: string; message?: string; details?: unknown } };

function fail(code: string, message?: string, details?: unknown): { ok: false; error: { code: string; message?: string; details?: unknown } } {
  return { ok: false, error: { code, message, details } };
}

function handleAuthError<T = undefined>(e: unknown): ActionResult<T> | null {
  if (e instanceof z.ZodError) return fail('INVALID_INPUT', undefined, e.issues) as ActionResult<T>;
  if (e instanceof AuthError) return fail(e.code) as ActionResult<T>;
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function loadGlossary(supabase: Awaited<ReturnType<typeof getCompanyContext>>['supabase'], company_id: string): Promise<GlossaryRow[]> {
  const { data } = await supabase
    .from('glossary_terms')
    .select('term_en, definition_en, term_es, definition_es')
    .eq('company_id', company_id);
  return (data ?? []) as GlossaryRow[];
}

interface VersionRow {
  id: string;
  version_number: number;
  content_en: string | null;
  content_es: string | null;
  flagged_terms: FlaggedTerm[] | null;
  needs_retranslation: boolean;
  original_file_url: string | null;
  published_at: string | null;
}

async function getLatestVersion(
  supabase: Awaited<ReturnType<typeof getCompanyContext>>['supabase'],
  sop_id: string,
): Promise<VersionRow | null> {
  const { data } = await supabase
    .from('sop_versions')
    .select('id, version_number, content_en, content_es, flagged_terms, needs_retranslation, original_file_url, published_at')
    .eq('sop_id', sop_id)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data ?? null) as VersionRow | null;
}

async function transitionStatus(
  supabase: Awaited<ReturnType<typeof getCompanyContext>>['supabase'],
  sop_id: string,
  from: SopStatus,
  to: SopStatus,
): Promise<{ ok: true } | { ok: false; code: string }> {
  if (!ALLOWED_SOP_TRANSITIONS[from].includes(to)) {
    return { ok: false, code: 'INVALID_TRANSITION' };
  }
  // Race-safe: update only if status is still `from`.
  const { data, error } = await supabase
    .from('sops')
    .update({ status: to, ...(to === 'archived' ? { archived_at: new Date().toISOString() } : {}) })
    .eq('id', sop_id)
    .eq('status', from)
    .select('id')
    .maybeSingle();
  if (error) return { ok: false, code: 'INTERNAL' };
  if (!data) return { ok: false, code: 'STATUS_CHANGED' };
  return { ok: true };
}

// ── 1. Create SOP from upload ─────────────────────────────────────────────────

// Per-SOP audience targeting. Mirrors the qr_codes audience shape so the
// helpers in lib/qr/audience.ts can be reused verbatim. ISO / quality
// regulation requires explicit doc control: at least one department or
// role must be picked. Empty audience is rejected at upload, on save in
// the Audience tab, and would also be caught by the worker-side
// passesAudience check (an empty audience reads as "everyone" — fine
// for legacy rows that the migration backfilled, but never a fresh
// row going forward).
const SopAudienceSchema = z.object({
  department_ids: z.array(z.string().uuid()).default([]),
  roles:          z.array(z.enum(['admin', 'manager', 'employee'])).default([]),
}).refine(
  (a) => a.department_ids.length > 0 || a.roles.length > 0,
  { message: 'pick at least one department or role' },
);

const CreateSopFromUploadSchema = z.object({
  title: z.string().min(1).max(200),
  // Required: every SOP must belong to a department so workers in that
  // department see it on their home feed and managers can scope reviews.
  department_id: z.string().uuid(),
  filename: z.string().min(1).max(300),
  mime_type: z.enum(SOP_UPLOAD_MIME_TYPES),
  file_base64: z.string().min(1),
  audience: SopAudienceSchema,
});

export async function createSopFromUpload(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId, supabase, company_id, role, impersonating } = await getCompanyContext('manager');
    const input = CreateSopFromUploadSchema.parse(raw);

    const fileBytes = Buffer.from(input.file_base64, 'base64');
    if (fileBytes.byteLength === 0) return fail('INVALID_INPUT', 'Empty file');
    if (fileBytes.byteLength > SOP_UPLOAD_MAX_BYTES) {
      return fail('INVALID_INPUT', 'File exceeds 10 MB');
    }

    // Verify the department belongs to this company. Catches stale UI
    // state (e.g., dept deleted between page render and submit) before
    // we strand a sops row + uploaded file.
    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('id', input.department_id)
      .eq('company_id', company_id)
      .maybeSingle();
    if (!dept) return fail('INVALID_INPUT', 'department not found');

    // Audience scope check — a non-HR department manager can only target
    // their own department(s). Reuses the helper that already powers QR
    // creation; identical creator-scope semantics across SOPs and QRs.
    const scope = await getCreatorScope({ supabase, userId, company_id, role, impersonating });
    if (!isWithinCreatorScope(input.audience, scope)) {
      return fail('FORBIDDEN', 'audience targets a department or role outside your scope');
    }

    // 1. Insert sops master row (status=draft, template=null).
    const { data: sop, error: sopErr } = await supabase
      .from('sops')
      .insert({
        company_id,
        title: input.title,
        template: null,
        department_id: input.department_id,
        audience_department_ids: input.audience.department_ids,
        audience_roles: input.audience.roles,
        status: 'draft' as SopStatus,
        created_by: userId,
      })
      .select('id')
      .single();
    if (sopErr || !sop) return fail('INTERNAL', sopErr?.message);

    // 2. Upload original to sop-uploads bucket. Admin client because
    //    storage RLS exists but the path predicate uses requesting_company_id()
    //    via JWT — we already have company_id verified server-side and want a
    //    deterministic path. Service-role write keeps the API simple.
    const safeName = input.filename.replace(/[^a-zA-Z0-9._-]+/g, '_');
    const path = `${company_id}/${sop.id}/v1/${safeName}`;
    const admin = getAdminClient();
    const { error: upErr } = await admin.storage
      .from(SOP_UPLOADS_BUCKET)
      .upload(path, fileBytes, { contentType: input.mime_type, upsert: false });
    if (upErr) {
      // Roll back the sops row so we don't strand a draft with no file.
      await supabase.from('sops').delete().eq('id', sop.id);
      return fail('INTERNAL', `Upload failed: ${upErr.message}`);
    }

    // 3. Insert sop_versions v1 pointing at the uploaded file.
    const { error: verErr } = await supabase.from('sop_versions').insert({
      sop_id: sop.id,
      company_id,
      version_number: 1,
      content_en: null,
      content_es: null,
      flagged_terms: null,
      needs_retranslation: false,
      original_file_url: path,
    });
    if (verErr) {
      await admin.storage.from(SOP_UPLOADS_BUCKET).remove([path]);
      await supabase.from('sops').delete().eq('id', sop.id);
      return fail('INTERNAL', verErr.message);
    }

    revalidatePath('/dashboard/sops');
    return { ok: true, data: { id: sop.id } };
  } catch (e) {
    const handled = handleAuthError<{ id: string }>(e);
    if (handled) return handled;
    throw e;
  }
}

// ── 2. Run Sonnet conversion ──────────────────────────────────────────────────

const RunConversionSchema = z.object({
  sop_id: z.string().uuid(),
});

export async function runConversion(raw: unknown): Promise<ActionResult<{ status: SopStatus; flagged_count: number }>> {
  try {
    const { supabase, company_id } = await getCompanyContext('manager');
    const input = RunConversionSchema.parse(raw);

    // Load sop + latest version.
    const { data: sop } = await supabase
      .from('sops')
      .select('id, status')
      .eq('id', input.sop_id)
      .eq('company_id', company_id)
      .maybeSingle();
    if (!sop) return fail('NOT_FOUND');
    if (sop.status !== 'draft') return fail('INVALID_TRANSITION', `Cannot convert from status ${sop.status}`);

    const version = await getLatestVersion(supabase, input.sop_id);
    if (!version || !version.original_file_url) return fail('NOT_FOUND', 'No upload found');

    // Download original from storage. Admin client bypasses RLS — we already
    // verified tenant scope above.
    const admin = getAdminClient();
    const { data: blob, error: dlErr } = await admin.storage
      .from(SOP_UPLOADS_BUCKET)
      .download(version.original_file_url);
    if (dlErr || !blob) return fail('INTERNAL', `Download failed: ${dlErr?.message ?? 'no blob'}`);

    const fileBuf = Buffer.from(await blob.arrayBuffer());
    const mimeType = blob.type || 'application/octet-stream';
    const glossary = await loadGlossary(supabase, company_id);

    // Dispatch to the right Sonnet pipeline by MIME.
    let result;
    if (isPdfMime(mimeType)) {
      result = await convertSopFromPdf({
        pdfBase64: fileBuf.toString('base64'),
        glossary,
        sopId: input.sop_id,
        companyId: company_id,
      });
    } else if (isImageMime(mimeType)) {
      result = await convertSopFromImage({
        imageBase64: fileBuf.toString('base64'),
        mimeType,
        glossary,
        sopId: input.sop_id,
        companyId: company_id,
      });
    } else {
      // Treat as text — utf-8 decode handles TXT and unknowns.
      result = await convertSopFromText({
        documentText: fileBuf.toString('utf-8'),
        glossary,
        sopId: input.sop_id,
        companyId: company_id,
      });
    }

    if (!result.ok) {
      // Forward the full Sonnet error envelope (duration_ms, attempt, raw,
      // model) into `details` so the manager UI can show debug info without
      // chasing through Vercel logs.
      return fail(result.error.code, result.error.message, result.error);
    }

    const conv: SopConversionResult = result.data;

    // Run Haiku template recommendation in parallel with the version DB write.
    // recommendTemplate is fire-safe — failures return null and are never
    // surfaced to the manager. Conversion succeeds regardless.
    const [vErr, templateRec] = await Promise.all([
      supabase
        .from('sop_versions')
        .update({ content_en: conv.markdown, flagged_terms: conv.flagged_terms })
        .eq('id', version.id)
        .then((r) => r.error),
      recommendTemplate(conv.markdown, { sopId: input.sop_id, companyId: company_id }),
    ]);
    if (vErr) return fail('INTERNAL', vErr.message);

    // Persist recommendation to sops row. Ignore failures — telemetry-grade write.
    if (templateRec) {
      await supabase
        .from('sops')
        .update({ template_recommendation: templateRec })
        .eq('id', input.sop_id)
        .eq('company_id', company_id);
    }

    // Transition: draft → pending_terms (always — manager confirms even with zero flagged terms).
    // If the conversion returned zero flagged terms, jump straight through to pending_translation.
    const target: SopStatus = conv.flagged_terms.length === 0 ? 'pending_translation' : 'pending_terms';

    const t1 = await transitionStatus(supabase, input.sop_id, 'draft', 'pending_terms');
    if (!t1.ok) return fail(t1.code, 'Failed to advance status');
    if (target === 'pending_translation') {
      const t2 = await transitionStatus(supabase, input.sop_id, 'pending_terms', 'pending_translation');
      if (!t2.ok) return fail(t2.code, 'Failed to advance status');
    }

    revalidatePath(`/dashboard/sops/${input.sop_id}`);
    revalidatePath('/dashboard/sops');
    return { ok: true, data: { status: target, flagged_count: conv.flagged_terms.length } };
  } catch (e) {
    const handled = handleAuthError<{ status: SopStatus; flagged_count: number }>(e);
    if (handled) return handled;
    throw e;
  }
}

// ── 3. Update template selection ─────────────────────────────────────────────

const UpdateSopTemplateSchema = z.object({
  sop_id: z.string().uuid(),
  template: z.enum(SOP_TEMPLATE),
});

export async function updateSopTemplate(raw: unknown): Promise<ActionResult> {
  try {
    const { supabase, company_id } = await getCompanyContext('manager');
    const input = UpdateSopTemplateSchema.parse(raw);

    const { error } = await supabase
      .from('sops')
      .update({ template: input.template as SopTemplate })
      .eq('id', input.sop_id)
      .eq('company_id', company_id);

    if (error) return fail('INTERNAL', error.message);

    revalidatePath(`/dashboard/sops/${input.sop_id}`);
    return { ok: true };
  } catch (e) {
    const handled = handleAuthError(e);
    if (handled) return handled;
    throw e;
  }
}

// ── 4. Define flagged terms ───────────────────────────────────────────────────

/**
 * Per-term resolution sent from the TermsGateClient when a flagged term
 * collides with an existing glossary entry (or is brand new):
 *
 *   - `use_new`      — write the manager's values. INSERT if no existing
 *                      row matches `lower(term_en)`, UPDATE the matched
 *                      row by id otherwise. Default for non-conflicts.
 *   - `use_existing` — leave the glossary alone. Default for conflicts.
 *   - `skip`         — same as `use_existing` for the glossary side; the
 *                      semantic difference (false-positive flag, not a
 *                      glossary term at all) only matters for telemetry
 *                      we may add later.
 */
const TermResolutionSchema = z.enum(['use_new', 'use_existing', 'skip']);

const DefinedTermSchema = z.object({
  term_en: z.string().min(1).max(200),
  definition_en: z.string().max(2000).optional().nullable(),
  term_es: z.string().min(1).max(200),
  definition_es: z.string().max(2000).optional().nullable(),
  resolution: TermResolutionSchema.default('use_new'),
});

const DefineFlaggedTermsSchema = z.object({
  sop_id: z.string().uuid(),
  terms: z.array(DefinedTermSchema),
});

export async function defineFlaggedTerms(raw: unknown): Promise<ActionResult<{ status: SopStatus }>> {
  try {
    const { userId, supabase, company_id } = await getCompanyContext('manager');
    const input = DefineFlaggedTermsSchema.parse(raw);

    const { data: sop } = await supabase
      .from('sops')
      .select('id, status')
      .eq('id', input.sop_id)
      .eq('company_id', company_id)
      .maybeSingle();
    if (!sop) return fail('NOT_FOUND');
    if (sop.status !== 'pending_terms') return fail('INVALID_TRANSITION');

    // Apply resolutions term-by-term. We deliberately skip the previous
    // `.upsert(..., { onConflict: 'company_id,term_en' })` approach: the
    // unique index is on `lower(term_en)` (case-insensitive, partial on
    // deleted_at IS NULL) which Supabase's PostgREST upsert can't target,
    // so any case mismatch on a re-uploaded SOP raised 23505. Doing the
    // dedup explicitly here is also where per-term resolutions land.
    const writes = input.terms.filter((t) => t.resolution === 'use_new');
    if (writes.length > 0) {
      // Fetch active glossary entries that match any of the lowered
      // English terms in one round-trip. RLS scopes by company_id; we add
      // the explicit filter as defense-in-depth and so Postgres uses the
      // (company_id, ...) leading-column index.
      const lowered = Array.from(new Set(writes.map((t) => t.term_en.toLowerCase())));
      const { data: existingRows } = await supabase
        .from('glossary_terms')
        .select('id, term_en')
        .eq('company_id', company_id)
        .is('deleted_at', null)
        .in('term_en', lowered.flatMap((l) => [l, l.toUpperCase()])); // best-effort prefilter; we re-check by lower() below

      // Build the lookup ourselves so case-folded matches work even when
      // the prefilter missed (the .in() above can't do `lower(term_en)`).
      const existingByLower = new Map<string, string>(); // lower(term_en) → row id
      for (const r of existingRows ?? []) {
        existingByLower.set((r.term_en as string).toLowerCase(), r.id as string);
      }

      // Some prefilter misses are inevitable — fall back to a second
      // narrower fetch only for terms we didn't see, by id. This stays
      // O(1) round-trips total because the second query is also batched.
      const missing = lowered.filter((l) => !existingByLower.has(l));
      if (missing.length > 0) {
        const { data: more } = await supabase
          .from('glossary_terms')
          .select('id, term_en')
          .eq('company_id', company_id)
          .is('deleted_at', null);
        for (const r of more ?? []) {
          const lower = (r.term_en as string).toLowerCase();
          if (!existingByLower.has(lower)) existingByLower.set(lower, r.id as string);
        }
      }

      const inserts: Array<Record<string, unknown>> = [];
      const updates: Array<{ id: string; row: Record<string, unknown> }> = [];
      for (const t of writes) {
        const lower = t.term_en.toLowerCase();
        const id = existingByLower.get(lower);
        const row = {
          term_en: t.term_en,
          definition_en: t.definition_en ?? null,
          term_es: t.term_es,
          definition_es: t.definition_es ?? null,
        };
        if (id) {
          updates.push({ id, row });
        } else {
          inserts.push({ company_id, created_by: userId, ...row });
        }
      }

      if (inserts.length > 0) {
        const { error: insErr } = await supabase.from('glossary_terms').insert(inserts);
        if (insErr) return fail('INTERNAL', insErr.message);
      }
      for (const u of updates) {
        const { error: updErr } = await supabase
          .from('glossary_terms')
          .update(u.row)
          .eq('id', u.id)
          .eq('company_id', company_id);
        if (updErr) return fail('INTERNAL', updErr.message);
      }
    }

    // Clear flagged_terms on the latest version — every flag has now been
    // resolved (written, kept-existing, or skipped). The SOP is ready for
    // translation regardless of which path each term took.
    const version = await getLatestVersion(supabase, input.sop_id);
    if (version) {
      await supabase
        .from('sop_versions')
        .update({ flagged_terms: [] })
        .eq('id', version.id);
    }

    const t = await transitionStatus(supabase, input.sop_id, 'pending_terms', 'pending_translation');
    if (!t.ok) return fail(t.code);

    revalidatePath(`/dashboard/sops/${input.sop_id}`);
    revalidatePath('/dashboard/sops');
    return { ok: true, data: { status: 'pending_translation' } };
  } catch (e) {
    const handled = handleAuthError<{ status: SopStatus }>(e);
    if (handled) return handled;
    throw e;
  }
}

// ── 4. Run Google translation + auto-publish ─────────────────────────────────
//
// Translation is the last manual gate. Once we have valid Spanish, we
// transition straight to `published` (skipping pending_approval) and
// generate the QR if it doesn't exist yet — the prior "Approve" step
// was just a human checkpoint with no per-SOP work, so removing it
// gives managers one-click publish without losing any data fidelity.
// Spanish can still be edited post-publish via `saveSpanishEdit`.

const RunTranslationSchema = z.object({
  sop_id: z.string().uuid(),
});

export async function runTranslation(
  raw: unknown,
): Promise<ActionResult<{ status: SopStatus; qr_code_id: string }>> {
  try {
    const { userId, supabase, company_id } = await getCompanyContext('manager');
    const input = RunTranslationSchema.parse(raw);

    const { data: sop } = await supabase
      .from('sops')
      .select('id, status, title')
      .eq('id', input.sop_id)
      .eq('company_id', company_id)
      .maybeSingle();
    if (!sop) return fail('NOT_FOUND');
    if (sop.status !== 'pending_translation') return fail('INVALID_TRANSITION');

    const version = await getLatestVersion(supabase, input.sop_id);
    if (!version || !version.content_en) return fail('NOT_FOUND', 'No English content');

    // Structured translator: parse mdast, translate text leaves, reassemble.
    // Tables / lists / callouts keep their structure. The previous flat-text
    // translator corrupted GFM table separators which then rendered as raw
    // pipes in the worker app.
    const glossary = await loadGlossary(supabase, company_id);
    const result = await translateMarkdownStructured({
      markdown: version.content_en,
      source: 'en',
      target: 'es',
      glossary,
      sopId: input.sop_id,
      companyId: company_id,
    });
    if (!result.ok) {
      return fail(result.error.code, result.error.message, result.error);
    }

    // Persist the Spanish content + clear the retranslation flag.
    const { error: vErr } = await supabase
      .from('sop_versions')
      .update({
        content_es: result.translated,
        needs_retranslation: false,
        published_at: new Date().toISOString(),
      })
      .eq('id', version.id);
    if (vErr) return fail('INTERNAL', vErr.message);

    // Status: pending_translation → published (skip pending_approval).
    const t = await transitionStatus(supabase, input.sop_id, 'pending_translation', 'published');
    if (!t.ok) return fail(t.code);

    // Find or create the QR. Permanent — same id across re-publishes.
    let qrCodeId: string;
    const { data: existingQr } = await supabase
      .from('qr_codes')
      .select('id')
      .eq('company_id', company_id)
      .eq('target_type', 'sop')
      .eq('target_id', input.sop_id)
      .maybeSingle();

    if (existingQr) {
      qrCodeId = existingQr.id as string;
    } else {
      const { data: company } = await supabase
        .from('companies')
        .select('phone')
        .eq('id', company_id)
        .single();
      const qr = await createQrCode({
        supabase,
        company_id,
        created_by: userId,
        target_type: 'sop',
        target_id: input.sop_id,
        label: sop.title,
        company_phone: company?.phone ?? null,
      });
      qrCodeId = qr.id;
    }

    revalidatePath(`/dashboard/sops/${input.sop_id}`);
    revalidatePath('/dashboard/sops');
    revalidatePath(`/app/sop/${input.sop_id}`);
    return { ok: true, data: { status: 'published', qr_code_id: qrCodeId } };
  } catch (e) {
    const handled = handleAuthError<{ status: SopStatus; qr_code_id: string }>(e);
    if (handled) return handled;
    throw e;
  }
}

// ── 5. Save Spanish edit (no version bump) ────────────────────────────────────

const SaveSpanishEditSchema = z.object({
  sop_id: z.string().uuid(),
  content_es: z.string().min(1).max(200_000),
});

export async function saveSpanishEdit(raw: unknown): Promise<ActionResult> {
  try {
    const { supabase, company_id } = await getCompanyContext('manager');
    const input = SaveSpanishEditSchema.parse(raw);

    const { data: sop } = await supabase
      .from('sops')
      .select('id')
      .eq('id', input.sop_id)
      .eq('company_id', company_id)
      .maybeSingle();
    if (!sop) return fail('NOT_FOUND');

    const version = await getLatestVersion(supabase, input.sop_id);
    if (!version) return fail('NOT_FOUND');

    // Inline edit: update content_es WITHOUT bumping version_number, clear
    // needs_retranslation. version_number bumps only happen on re-upload.
    const { error } = await supabase
      .from('sop_versions')
      .update({ content_es: input.content_es, needs_retranslation: false })
      .eq('id', version.id);
    if (error) return fail('INTERNAL', error.message);

    revalidatePath(`/dashboard/sops/${input.sop_id}`);
    revalidatePath(`/app/sop/${input.sop_id}`);
    return { ok: true };
  } catch (e) {
    const handled = handleAuthError(e);
    if (handled) return handled;
    throw e;
  }
}

// ── 6. Update SOP audience (visibility / doc control) ────────────────────────
//
// Lets a manager edit who can see a published SOP without bumping the
// version or re-translating — visibility is metadata, not content.
// Same Zod shape as the upload's audience block (must be non-empty),
// same creator-scope guard (department managers limited to own depts).

const UpdateSopAudienceSchema = z.object({
  sop_id: z.string().uuid(),
  audience: SopAudienceSchema,
});

export async function updateSopAudience(raw: unknown): Promise<ActionResult<{ ok: true }>> {
  try {
    const { userId, supabase, company_id, role, impersonating } = await getCompanyContext('manager');
    const input = UpdateSopAudienceSchema.parse(raw);

    const { data: sop } = await supabase
      .from('sops')
      .select('id')
      .eq('id', input.sop_id)
      .eq('company_id', company_id)
      .maybeSingle();
    if (!sop) return fail('NOT_FOUND');

    const scope = await getCreatorScope({ supabase, userId, company_id, role, impersonating });
    if (!isWithinCreatorScope(input.audience, scope)) {
      return fail('FORBIDDEN', 'audience targets a department or role outside your scope');
    }

    const { error: updErr } = await supabase
      .from('sops')
      .update({
        audience_department_ids: input.audience.department_ids,
        audience_roles: input.audience.roles,
      })
      .eq('id', input.sop_id)
      .eq('company_id', company_id);
    if (updErr) return fail('INTERNAL', updErr.message);

    revalidatePath(`/dashboard/sops/${input.sop_id}`);
    revalidatePath('/dashboard/sops');
    revalidatePath(`/app/sop/${input.sop_id}`);
    return { ok: true, data: { ok: true } };
  } catch (e) {
    const handled = handleAuthError<{ ok: true }>(e);
    if (handled) return handled;
    throw e;
  }
}

// Audience shape for SOP code. Mirrors the QR audience shape — same
// arrays, same union semantics — declared as a type alias rather than a
// re-export so the SWC/Turbopack runtime bundle has nothing to resolve
// at module-evaluation time. (A `type X as Y` style export was emitting
// a stray runtime reference under Turbopack and bricking module load.)
import type { QrAudience } from '@/lib/qr/audience';
export type Audience = QrAudience;

// ── 7. Video URL ──────────────────────────────────────────────────────────────

const UpdateSopVideoUrlSchema = z.object({
  sop_id: z.string().uuid(),
  video_url: z.string().url().max(2048).nullable(),
});

export async function updateSopVideoUrl(raw: unknown): Promise<ActionResult<{ ok: true }>> {
  try {
    const { supabase, company_id } = await getCompanyContext('manager');
    const input = UpdateSopVideoUrlSchema.parse(raw);

    const { data: sop } = await supabase
      .from('sops')
      .select('id')
      .eq('id', input.sop_id)
      .eq('company_id', company_id)
      .maybeSingle();
    if (!sop) return fail('NOT_FOUND');

    const { error: updErr } = await supabase
      .from('sops')
      .update({ video_url: input.video_url })
      .eq('id', input.sop_id)
      .eq('company_id', company_id);
    if (updErr) return fail('INTERNAL', updErr.message);

    revalidatePath(`/dashboard/sops/${input.sop_id}`);
    revalidatePath(`/app/sop/${input.sop_id}`);
    return { ok: true, data: { ok: true } };
  } catch (e) {
    const handled = handleAuthError<{ ok: true }>(e);
    if (handled) return handled;
    throw e;
  }
}

// ── 8. Archive ────────────────────────────────────────────────────────────────
//
// (The previous `approveSop` action was retired when translation auto-
// publishes. QR creation + published_at stamping moved into `runTranslation`.
// Existing pending_approval rows — if any — get auto-promoted to published
// by migration 20260427000001_drop_sop_approval_step.sql.)

const ArchiveSopSchema = z.object({
  sop_id: z.string().uuid(),
});

export async function archiveSop(raw: unknown): Promise<ActionResult> {
  try {
    const { supabase, company_id } = await getCompanyContext('manager');
    const input = ArchiveSopSchema.parse(raw);

    const { data: sop } = await supabase
      .from('sops')
      .select('id, status')
      .eq('id', input.sop_id)
      .eq('company_id', company_id)
      .maybeSingle();
    if (!sop) return fail('NOT_FOUND');
    if (sop.status !== 'published') return fail('INVALID_TRANSITION');

    const t = await transitionStatus(supabase, input.sop_id, 'published', 'archived');
    if (!t.ok) return fail(t.code);

    revalidatePath(`/dashboard/sops/${input.sop_id}`);
    revalidatePath('/dashboard/sops');
    return { ok: true };
  } catch (e) {
    const handled = handleAuthError(e);
    if (handled) return handled;
    throw e;
  }
}

// ── 7b. Hard delete (super admin only) ───────────────────────────────────────

const HardDeleteSopSchema = z.object({
  sop_id: z.string().uuid(),
  // Caller must echo the SOP title back. The action verifies a
  // case-insensitive trimmed match before destroying anything; this is
  // the single human-in-the-loop guard between a god-mode UI click and
  // permanent loss of versions, QR codes, and uploaded files.
  confirm_title: z.string().min(1).max(500),
});

/**
 * Permanently destroys an SOP and everything that hangs off it. Super
 * admin only. Distinct from `archiveSop` (soft, manager-callable, status
 * lifecycle): this is the unrecoverable purge for tenant cleanup, demo
 * data, or a manager mistake the tenant cannot reach themselves.
 *
 * Order of destruction:
 *   1. Storage objects under sop-uploads/${company_id}/${sop_id}/...
 *      (best effort — a misconfigured bucket can't block the row delete)
 *   2. qr_codes rows targeting this SOP (cascades to qr_scans).
 *      No FK from qr_codes.target_id, so this is a manual cleanup.
 *   3. sops row (cascades to sop_versions).
 *   4. Audit row in super_admin_events with the captured counts so the
 *      paper trail survives even though the source rows are gone.
 *
 * Authentication uses `getSuperAdminContext()` which throws FORBIDDEN
 * for everyone else — including impersonating super admins, since the
 * Clerk session is still the super admin's. RLS bypass via the admin
 * client is necessary because we're operating across tenants from a
 * single super-admin session.
 */
export async function hardDeleteSop(raw: unknown): Promise<ActionResult> {
  try {
    const { userId } = await getSuperAdminContext();
    const input = HardDeleteSopSchema.parse(raw);

    const admin = getAdminClient();

    // Read the SOP for audit metadata + existence check. Admin client
    // because the super admin operates across tenants and we don't have
    // a company_id to scope by until we read this row.
    const { data: sop, error: sopReadErr } = await admin
      .from('sops')
      .select('id, title, company_id, status')
      .eq('id', input.sop_id)
      .maybeSingle();
    if (sopReadErr) return fail('INTERNAL', sopReadErr.message);
    if (!sop) return fail('NOT_FOUND');

    if (sop.title.trim().toLowerCase() !== input.confirm_title.trim().toLowerCase()) {
      return fail(
        'CONFIRM_MISMATCH',
        'The title you typed does not match. Hard delete refused.',
      );
    }

    // Capture cascade counts for the audit row before anything is removed.
    const [{ count: versionCount }, qrRowsRes, versionFilesRes] = await Promise.all([
      admin
        .from('sop_versions')
        .select('id', { count: 'exact', head: true })
        .eq('sop_id', sop.id),
      admin
        .from('qr_codes')
        .select('id')
        .eq('target_type', 'sop')
        .eq('target_id', sop.id),
      admin
        .from('sop_versions')
        .select('original_file_url')
        .eq('sop_id', sop.id)
        .not('original_file_url', 'is', null),
    ]);

    const qrIds = (qrRowsRes.data ?? []).map((r) => r.id as string);
    const filesToRemove = (versionFilesRes.data ?? [])
      .map((r) => r.original_file_url as string | null)
      .filter((p): p is string => Boolean(p));

    // 1. Storage purge. Best-effort: a remove failure does not block the
    // row delete, otherwise a misconfigured bucket would strand the row
    // and force manual SQL cleanup. The audit row records the count we
    // attempted to remove either way.
    let storageRemoved = filesToRemove.length;
    if (filesToRemove.length > 0) {
      const { data: removed, error: rmErr } = await admin.storage
        .from(SOP_UPLOADS_BUCKET)
        .remove(filesToRemove);
      if (rmErr) {
        console.warn(
          '[hardDeleteSop] storage remove failed; proceeding',
          { sop_id: sop.id, message: rmErr.message },
        );
        storageRemoved = 0;
      } else {
        storageRemoved = removed?.length ?? 0;
      }
    }

    // 2. QR cleanup. No FK from qr_codes.target_id, so we can't rely on
    // cascade — but qr_scans does cascade off qr_codes.id, so deleting
    // the QR rows takes the scan history with them.
    if (qrIds.length > 0) {
      const { error: qrErr } = await admin
        .from('qr_codes')
        .delete()
        .in('id', qrIds);
      if (qrErr) return fail('INTERNAL', `QR cleanup failed: ${qrErr.message}`);
    }

    // 3. SOP row. Cascades to sop_versions via the FK in 20260424000003.
    const { error: delErr } = await admin
      .from('sops')
      .delete()
      .eq('id', sop.id);
    if (delErr) return fail('INTERNAL', `SOP delete failed: ${delErr.message}`);

    // 4. Audit row. Lives outside the deletion blast radius (company_id
    // is on delete set null) so the trail survives a future tenant purge.
    await admin.from('super_admin_events').insert({
      super_admin_clerk_user_id: userId,
      action: 'sop.hard_delete',
      subject_type: 'sop',
      subject_id: sop.id,
      company_id: sop.company_id,
      metadata: {
        sop_title: sop.title,
        sop_status: sop.status,
        version_count: versionCount ?? 0,
        qr_code_count: qrIds.length,
        storage_files_removed: storageRemoved,
        storage_files_attempted: filesToRemove.length,
      },
    });

    revalidatePath('/dashboard/sops');
    return { ok: true };
  } catch (e) {
    const handled = handleAuthError(e);
    if (handled) return handled;
    throw e;
  }
}

// ── 8. Upload new version ─────────────────────────────────────────────────────

const UploadNewVersionSchema = z.object({
  sop_id: z.string().uuid(),
  filename: z.string().min(1).max(300),
  mime_type: z.enum(SOP_UPLOAD_MIME_TYPES),
  file_base64: z.string().min(1),
});

export async function uploadNewVersion(raw: unknown): Promise<ActionResult<{ version_number: number }>> {
  try {
    const { supabase, company_id } = await getCompanyContext('manager');
    const input = UploadNewVersionSchema.parse(raw);

    const fileBytes = Buffer.from(input.file_base64, 'base64');
    if (fileBytes.byteLength === 0) return fail('INVALID_INPUT', 'Empty file');
    if (fileBytes.byteLength > SOP_UPLOAD_MAX_BYTES) {
      return fail('INVALID_INPUT', 'File exceeds 10 MB');
    }

    const { data: sop } = await supabase
      .from('sops')
      .select('id, status')
      .eq('id', input.sop_id)
      .eq('company_id', company_id)
      .maybeSingle();
    if (!sop) return fail('NOT_FOUND');
    if (sop.status === 'archived') return fail('INVALID_TRANSITION', 'Cannot re-upload an archived SOP');

    // Determine next version number.
    const { data: lastV } = await supabase
      .from('sop_versions')
      .select('version_number')
      .eq('sop_id', input.sop_id)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = (lastV?.version_number ?? 0) + 1;

    const safeName = input.filename.replace(/[^a-zA-Z0-9._-]+/g, '_');
    const path = `${company_id}/${input.sop_id}/v${nextVersion}/${safeName}`;
    const admin = getAdminClient();
    const { error: upErr } = await admin.storage
      .from(SOP_UPLOADS_BUCKET)
      .upload(path, fileBytes, { contentType: input.mime_type, upsert: false });
    if (upErr) return fail('INTERNAL', `Upload failed: ${upErr.message}`);

    const { error: vErr } = await supabase.from('sop_versions').insert({
      sop_id: input.sop_id,
      company_id,
      version_number: nextVersion,
      content_en: null,
      content_es: null,
      flagged_terms: null,
      needs_retranslation: false,
      original_file_url: path,
    });
    if (vErr) {
      await admin.storage.from(SOP_UPLOADS_BUCKET).remove([path]);
      return fail('INTERNAL', vErr.message);
    }

    // Reset status to draft so the manager re-runs conversion. The previous
    // published version stays live until the new one is approved (we don't
    // touch sop_versions.published_at on the prior row).
    // The status reset is unconditional because the sops.status is the
    // *current* pipeline stage; the published v(N-1) lives on independently.
    const { error: stErr } = await supabase
      .from('sops')
      .update({ status: 'draft' as SopStatus })
      .eq('id', input.sop_id);
    if (stErr) return fail('INTERNAL', stErr.message);

    revalidatePath(`/dashboard/sops/${input.sop_id}`);
    revalidatePath('/dashboard/sops');
    return { ok: true, data: { version_number: nextVersion } };
  } catch (e) {
    const handled = handleAuthError<{ version_number: number }>(e);
    if (handled) return handled;
    throw e;
  }
}

// ── 9. Worker preferred language ──────────────────────────────────────────────

const SetLanguagePreferenceSchema = z.object({
  language: z.enum(WORKER_LANGUAGES),
});

export async function setLanguagePreference(raw: unknown): Promise<ActionResult> {
  try {
    const { userId, supabase, company_id } = await getCompanyContext();
    const input = SetLanguagePreferenceSchema.parse(raw);

    const { error } = await supabase
      .from('company_members')
      .update({ preferred_language: input.language })
      .eq('clerk_user_id', userId)
      .eq('company_id', company_id);
    if (error) return fail('INTERNAL', error.message);

    // Caller (LanguageToggleClient) follows up with router.refresh() —
    // no path-based revalidation needed for a per-user preference write.
    return { ok: true };
  } catch (e) {
    const handled = handleAuthError(e);
    if (handled) return handled;
    throw e;
  }
}
