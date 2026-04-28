"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { AuthError, getCompanyContext } from "@/lib/auth/company-context";
import { getCreatorScope } from "@/lib/qr/creator-scope";
import { translateMarkdown } from "@/lib/translation/google";
import {
  ANNOUNCEMENT_BODY_MAX,
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_TITLE_MAX,
} from "@/lib/types/announcements";

type ActionResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: { code: string; message?: string; details?: unknown } };

function fail(
  code: string,
  message?: string,
  details?: unknown,
): { ok: false; error: { code: string; message?: string; details?: unknown } } {
  return { ok: false, error: { code, message, details } };
}

function handleAuthError<T = undefined>(e: unknown): ActionResult<T> | null {
  if (e instanceof z.ZodError)
    return fail("INVALID_INPUT", undefined, e.issues) as ActionResult<T>;
  if (e instanceof AuthError) return fail(e.code) as ActionResult<T>;
  return null;
}

// ── Create ────────────────────────────────────────────────────────────────────

const CreateAnnouncementSchema = z.object({
  title_en: z.string().min(1).max(ANNOUNCEMENT_TITLE_MAX),
  body_en: z.string().min(1).max(ANNOUNCEMENT_BODY_MAX),
  department_id: z.string().uuid().nullable(),
  priority: z.enum(ANNOUNCEMENT_PRIORITIES),
  pinned: z.boolean().default(false),
  expires_at: z.string().datetime().nullable().optional(),
});

export async function createAnnouncement(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId, supabase, company_id, role, impersonating } =
      await getCompanyContext("manager");
    const input = CreateAnnouncementSchema.parse(raw);

    // Enforce department scope for non-admin/non-HR managers
    const scope = await getCreatorScope({
      supabase,
      userId,
      company_id,
      role,
      impersonating,
    });

    if (!scope.unrestricted) {
      if (input.department_id === null) {
        return fail("FORBIDDEN", "Only admins and HR managers can post org-wide announcements.");
      }
      if (!scope.allowed_department_ids.includes(input.department_id)) {
        return fail("FORBIDDEN", "You can only post to your own department.");
      }
    }

    // Fetch glossary for translation consistency
    const { data: glossary } = await supabase
      .from("glossary_terms")
      .select("term_en, definition_en, term_es, definition_es")
      .eq("company_id", company_id)
      .is("deleted_at", null);

    const glossaryRows = glossary ?? [];

    // Translate title and body in parallel
    const [titleResult, bodyResult] = await Promise.all([
      translateMarkdown({
        markdown: input.title_en,
        source: "en",
        target: "es",
        glossary: glossaryRows,
        companyId: company_id,
      }),
      translateMarkdown({
        markdown: input.body_en,
        source: "en",
        target: "es",
        glossary: glossaryRows,
        companyId: company_id,
      }),
    ]);

    const title_es = titleResult.ok ? titleResult.translated : input.title_en;
    const body_es = bodyResult.ok ? bodyResult.translated : input.body_en;

    const { data, error } = await supabase
      .from("announcements")
      .insert({
        company_id,
        department_id: input.department_id,
        created_by: userId,
        title_en: input.title_en,
        title_es,
        body_en: input.body_en,
        body_es,
        priority: input.priority,
        pinned: input.pinned,
        expires_at: input.expires_at ?? null,
      })
      .select("id")
      .single();

    if (error) return fail("INTERNAL", error.message);

    revalidatePath("/dashboard/announcements");
    return { ok: true, data: { id: data.id } };
  } catch (e) {
    const handled = handleAuthError<{ id: string }>(e);
    if (handled) return handled;
    throw e;
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

const DeleteAnnouncementSchema = z.object({
  id: z.string().uuid(),
});

export async function deleteAnnouncement(raw: unknown): Promise<ActionResult> {
  try {
    const { userId, supabase, company_id, role } =
      await getCompanyContext("manager");
    const { id } = DeleteAnnouncementSchema.parse(raw);

    const { data: existing } = await supabase
      .from("announcements")
      .select("id, created_by")
      .eq("id", id)
      .eq("company_id", company_id)
      .maybeSingle();

    if (!existing) return fail("NOT_FOUND");

    // Managers can only delete their own; admins can delete any
    if (role !== "admin" && existing.created_by !== userId) {
      return fail("FORBIDDEN", "You can only delete your own announcements.");
    }

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id)
      .eq("company_id", company_id);

    if (error) return fail("INTERNAL", error.message);

    revalidatePath("/dashboard/announcements");
    return { ok: true };
  } catch (e) {
    const handled = handleAuthError(e);
    if (handled) return handled;
    throw e;
  }
}

// ── Mark read (single) ────────────────────────────────────────────────────────

const MarkReadSchema = z.object({
  announcement_id: z.string().uuid(),
});

export async function markAnnouncementRead(raw: unknown): Promise<ActionResult> {
  try {
    const { userId, supabase } = await getCompanyContext();

    const { announcement_id } = MarkReadSchema.parse(raw);

    const { data: member } = await supabase
      .from("company_members")
      .select("id")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (!member) return fail("NO_COMPANY");

    await supabase.from("announcement_reads").upsert(
      { announcement_id, company_member_id: member.id },
      { onConflict: "announcement_id,company_member_id", ignoreDuplicates: true },
    );

    return { ok: true };
  } catch (e) {
    const handled = handleAuthError(e);
    if (handled) return handled;
    throw e;
  }
}

// ── Mark all read ─────────────────────────────────────────────────────────────

export async function markAllAnnouncementsRead(): Promise<ActionResult> {
  try {
    const { userId, supabase, company_id } = await getCompanyContext();

    const { data: member } = await supabase
      .from("company_members")
      .select("id")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (!member) return fail("NO_COMPANY");

    // Get all announcement IDs visible to this employee's departments + org-wide
    const { data: empDepts } = await supabase
      .from("employee_departments")
      .select("department_id")
      .eq("member_id", member.id);

    const deptIds = (empDepts ?? []).map((r) => r.department_id);

    const now = new Date().toISOString();
    let query = supabase
      .from("announcements")
      .select("id")
      .eq("company_id", company_id)
      .or(`expires_at.is.null,expires_at.gt.${now}`);

    if (deptIds.length > 0) {
      query = query.or(`department_id.is.null,department_id.in.(${deptIds.join(",")})`);
    } else {
      query = query.is("department_id", null);
    }

    const { data: visible } = await query;
    if (!visible?.length) return { ok: true };

    const rows = visible.map((a) => ({
      announcement_id: a.id,
      company_member_id: member.id,
    }));

    await supabase
      .from("announcement_reads")
      .upsert(rows, {
        onConflict: "announcement_id,company_member_id",
        ignoreDuplicates: true,
      });

    revalidatePath("/app/home");
    return { ok: true };
  } catch (e) {
    const handled = handleAuthError(e);
    if (handled) return handled;
    throw e;
  }
}
