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
import type { GlossaryRow } from '@/lib/types/glossary';
import { translateMarkdown } from '@/lib/translation/google';
import { createQrCode } from '@/lib/qr/generate';
import {
  ALLOWED_SOP_TRANSITIONS,
  SOP_UPLOADS_BUCKET,
  SOP_UPLOAD_MAX_BYTES,
  SOP_UPLOAD_MIME_TYPES,
  WORKER_LANGUAGES,
  isImageMime,
  isPdfMime,
  type SopStatus,
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

const CreateSopFromUploadSchema = z.object({
  title: z.string().min(1).max(200),
  department_id: z.string().uuid().nullable().optional(),
  filename: z.string().min(1).max(300),
  mime_type: z.enum(SOP_UPLOAD_MIME_TYPES),
  file_base64: z.string().min(1),
});

export async function createSopFromUpload(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId, supabase, company_id } = await getCompanyContext('manager');
    const input = CreateSopFromUploadSchema.parse(raw);

    const fileBytes = Buffer.from(input.file_base64, 'base64');
    if (fileBytes.byteLength === 0) return fail('INVALID_INPUT', 'Empty file');
    if (fileBytes.byteLength > SOP_UPLOAD_MAX_BYTES) {
      return fail('INVALID_INPUT', 'File exceeds 10 MB');
    }

    // 1. Insert sops master row (status=draft, template=null).
    const { data: sop, error: sopErr } = await supabase
      .from('sops')
      .insert({
        company_id,
        title: input.title,
        template: null,
        department_id: input.department_id ?? null,
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

    // Persist English markdown + flagged terms onto the latest version.
    const { error: vErr } = await supabase
      .from('sop_versions')
      .update({
        content_en: conv.markdown,
        flagged_terms: conv.flagged_terms,
      })
      .eq('id', version.id);
    if (vErr) return fail('INTERNAL', vErr.message);

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

// ── 3. Define flagged terms ───────────────────────────────────────────────────

const DefinedTermSchema = z.object({
  term_en: z.string().min(1).max(200),
  definition_en: z.string().max(2000).optional().nullable(),
  term_es: z.string().min(1).max(200),
  definition_es: z.string().max(2000).optional().nullable(),
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

    // Upsert each term into glossary_terms. Unique (company_id, lower(term_en)).
    if (input.terms.length > 0) {
      const rows = input.terms.map((t) => ({
        company_id,
        term_en: t.term_en,
        definition_en: t.definition_en ?? null,
        term_es: t.term_es,
        definition_es: t.definition_es ?? null,
        created_by: userId,
      }));
      const { error: upErr } = await supabase
        .from('glossary_terms')
        .upsert(rows, { onConflict: 'company_id,term_en' });
      if (upErr) return fail('INTERNAL', upErr.message);
    }

    // Clear flagged_terms on the latest version — they're all defined now.
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

// ── 4. Run Google translation ─────────────────────────────────────────────────

const RunTranslationSchema = z.object({
  sop_id: z.string().uuid(),
});

export async function runTranslation(raw: unknown): Promise<ActionResult<{ status: SopStatus }>> {
  try {
    const { supabase, company_id } = await getCompanyContext('manager');
    const input = RunTranslationSchema.parse(raw);

    const { data: sop } = await supabase
      .from('sops')
      .select('id, status')
      .eq('id', input.sop_id)
      .eq('company_id', company_id)
      .maybeSingle();
    if (!sop) return fail('NOT_FOUND');
    if (sop.status !== 'pending_translation') return fail('INVALID_TRANSITION');

    const version = await getLatestVersion(supabase, input.sop_id);
    if (!version || !version.content_en) return fail('NOT_FOUND', 'No English content');

    const glossary = await loadGlossary(supabase, company_id);
    const result = await translateMarkdown({
      markdown: version.content_en,
      source: 'en',
      target: 'es',
      glossary,
      sopId: input.sop_id,
      companyId: company_id,
    });
    if (!result.ok) {
      // Forward duration_ms, attempt, http_status, raw — the manager UI's
      // Technical details panel reads these out of `details`.
      return fail(result.error.code, result.error.message, result.error);
    }

    const { error: vErr } = await supabase
      .from('sop_versions')
      .update({ content_es: result.translated, needs_retranslation: false })
      .eq('id', version.id);
    if (vErr) return fail('INTERNAL', vErr.message);

    const t = await transitionStatus(supabase, input.sop_id, 'pending_translation', 'pending_approval');
    if (!t.ok) return fail(t.code);

    revalidatePath(`/dashboard/sops/${input.sop_id}`);
    revalidatePath('/dashboard/sops');
    return { ok: true, data: { status: 'pending_approval' } };
  } catch (e) {
    const handled = handleAuthError<{ status: SopStatus }>(e);
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

// ── 6. Approve + publish (creates QR on first publish) ────────────────────────

const ApproveSopSchema = z.object({
  sop_id: z.string().uuid(),
});

export async function approveSop(raw: unknown): Promise<ActionResult<{ qr_code_id: string }>> {
  try {
    const { userId, supabase, company_id } = await getCompanyContext('manager');
    const input = ApproveSopSchema.parse(raw);

    const { data: sop } = await supabase
      .from('sops')
      .select('id, status, title')
      .eq('id', input.sop_id)
      .eq('company_id', company_id)
      .maybeSingle();
    if (!sop) return fail('NOT_FOUND');
    if (sop.status !== 'pending_approval') return fail('INVALID_TRANSITION');

    const version = await getLatestVersion(supabase, input.sop_id);
    if (!version || !version.content_en || !version.content_es) {
      return fail('NOT_FOUND', 'Missing content');
    }

    const t = await transitionStatus(supabase, input.sop_id, 'pending_approval', 'published');
    if (!t.ok) return fail(t.code);

    // Stamp published_at on the version.
    await supabase
      .from('sop_versions')
      .update({ published_at: new Date().toISOString() })
      .eq('id', version.id);

    // Find or create the QR code for this SOP. A QR is permanent — same id
    // across re-publishes. Look for an existing one first.
    const { data: existingQr } = await supabase
      .from('qr_codes')
      .select('id')
      .eq('company_id', company_id)
      .eq('target_type', 'sop')
      .eq('target_id', input.sop_id)
      .maybeSingle();

    let qrId: string;
    if (existingQr) {
      qrId = existingQr.id as string;
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
      qrId = qr.id;
    }

    revalidatePath(`/dashboard/sops/${input.sop_id}`);
    revalidatePath('/dashboard/sops');
    revalidatePath(`/app/sop/${input.sop_id}`);
    return { ok: true, data: { qr_code_id: qrId } };
  } catch (e) {
    const handled = handleAuthError<{ qr_code_id: string }>(e);
    if (handled) return handled;
    throw e;
  }
}

// ── 7. Archive ────────────────────────────────────────────────────────────────

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
