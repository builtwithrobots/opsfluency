"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AuthError, getCompanyContext } from "@/lib/auth/company-context";
import { TAG_NAME_MAX, TAG_COLORS, type Tag, type TagWithUsage } from "@/lib/types/tags";

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
  if (e instanceof z.ZodError) return fail("INVALID_INPUT", undefined, e.issues) as ActionResult<T>;
  if (e instanceof AuthError) return fail(e.code) as ActionResult<T>;
  return null;
}

const tagColors = TAG_COLORS as readonly string[];

const TagNameInput = z.object({
  name_en: z.string().trim().min(1, "Required").max(TAG_NAME_MAX),
  name_es: z.string().trim().min(1, "Required").max(TAG_NAME_MAX),
  color: z.string().refine((c) => tagColors.includes(c), { message: "Invalid color" }),
});

const IdInput = z.object({ id: z.string().uuid() });

const SetTermTagsInput = z.object({
  termId: z.string().uuid(),
  tagIds: z.array(z.string().uuid()),
});

const SetSopTagsInput = z.object({
  sopId: z.string().uuid(),
  tagIds: z.array(z.string().uuid()),
});

const PG_UNIQUE_VIOLATION = "23505";

function revalidateTaggedPages() {
  revalidatePath("/dashboard/glossary");
  revalidatePath("/dashboard/sops");
  revalidatePath("/dashboard/org-settings");
}

// ── List (picker) — active tags only ────────────────────────────────────────

export async function listTags(): Promise<ActionResult<Tag[]>> {
  try {
    const { supabase, company_id } = await getCompanyContext("manager");

    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("company_id", company_id)
      .is("archived_at", null)
      .order("source", { ascending: false })
      .order("name_en", { ascending: true });

    if (error) return fail("INTERNAL", error.message);
    return { ok: true, data: (data ?? []) as Tag[] };
  } catch (e) {
    const handled = handleAuthError<Tag[]>(e);
    if (handled) return handled;
    throw e;
  }
}

// ── List with usage counts (settings page) — all tags incl. archived ────────

export async function listTagsWithUsage(): Promise<ActionResult<TagWithUsage[]>> {
  try {
    const { supabase, company_id } = await getCompanyContext("admin");

    const { data: tags, error } = await supabase
      .from("tags")
      .select("*")
      .eq("company_id", company_id)
      .order("source", { ascending: false })
      .order("name_en", { ascending: true });

    if (error) return fail("INTERNAL", error.message);
    if (!tags || tags.length === 0) return { ok: true, data: [] };

    const tagIds = tags.map((t) => t.id);

    const [{ data: sopLinks }, { data: termLinks }] = await Promise.all([
      supabase.from("sop_tags").select("tag_id").in("tag_id", tagIds),
      supabase.from("glossary_term_tags").select("tag_id").in("tag_id", tagIds),
    ]);

    const sopCounts = new Map<string, number>();
    const termCounts = new Map<string, number>();
    for (const r of sopLinks ?? []) sopCounts.set(r.tag_id, (sopCounts.get(r.tag_id) ?? 0) + 1);
    for (const r of termLinks ?? []) termCounts.set(r.tag_id, (termCounts.get(r.tag_id) ?? 0) + 1);

    const result: TagWithUsage[] = (tags as Tag[]).map((t) => ({
      ...t,
      sop_count: sopCounts.get(t.id) ?? 0,
      term_count: termCounts.get(t.id) ?? 0,
    }));

    return { ok: true, data: result };
  } catch (e) {
    const handled = handleAuthError<TagWithUsage[]>(e);
    if (handled) return handled;
    throw e;
  }
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createTag(raw: unknown): Promise<ActionResult<Tag>> {
  try {
    const { supabase, company_id, userId } = await getCompanyContext("manager");
    const parsed = TagNameInput.parse(raw);

    const { data, error } = await supabase
      .from("tags")
      .insert({
        company_id,
        name_en: parsed.name_en,
        name_es: parsed.name_es,
        color: parsed.color,
        source: "custom",
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === PG_UNIQUE_VIOLATION) {
        return fail("DUPLICATE_TAG", `A label named "${parsed.name_en}" already exists.`);
      }
      return fail("INTERNAL", error.message);
    }

    revalidateTaggedPages();
    return { ok: true, data: data as Tag };
  } catch (e) {
    const handled = handleAuthError<Tag>(e);
    if (handled) return handled;
    throw e;
  }
}

// ── Update (rename + recolor) — admin only ────────────────────────────────────

const UpdateTagInput = TagNameInput.extend({ id: z.string().uuid() });

export async function updateTag(raw: unknown): Promise<ActionResult<Tag>> {
  try {
    const { supabase, company_id } = await getCompanyContext("admin");
    const parsed = UpdateTagInput.parse(raw);

    const { data: existing } = await supabase
      .from("tags")
      .select("source")
      .eq("id", parsed.id)
      .eq("company_id", company_id)
      .maybeSingle();

    if (!existing) return fail("NOT_FOUND", "Label not found.");
    if (existing.source === "department") return fail("FORBIDDEN", "Department labels cannot be edited.");

    const { data, error } = await supabase
      .from("tags")
      .update({ name_en: parsed.name_en, name_es: parsed.name_es, color: parsed.color })
      .eq("id", parsed.id)
      .eq("company_id", company_id)
      .select()
      .single();

    if (error) {
      if (error.code === PG_UNIQUE_VIOLATION) {
        return fail("DUPLICATE_TAG", `A label named "${parsed.name_en}" already exists.`);
      }
      return fail("INTERNAL", error.message);
    }

    revalidateTaggedPages();
    return { ok: true, data: data as Tag };
  } catch (e) {
    const handled = handleAuthError<Tag>(e);
    if (handled) return handled;
    throw e;
  }
}

// ── Archive — admin only ──────────────────────────────────────────────────────

export async function archiveTag(raw: unknown): Promise<ActionResult> {
  try {
    const { supabase, company_id } = await getCompanyContext("admin");
    const { id } = IdInput.parse(raw);

    const { data: existing } = await supabase
      .from("tags")
      .select("source, archived_at")
      .eq("id", id)
      .eq("company_id", company_id)
      .maybeSingle();

    if (!existing) return fail("NOT_FOUND", "Label not found.");
    if (existing.source === "department") return fail("FORBIDDEN", "Department labels cannot be archived.");
    if (existing.archived_at) return { ok: true }; // already archived

    const { error } = await supabase
      .from("tags")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id)
      .eq("company_id", company_id);

    if (error) return fail("INTERNAL", error.message);

    revalidateTaggedPages();
    return { ok: true };
  } catch (e) {
    const handled = handleAuthError(e);
    if (handled) return handled;
    throw e;
  }
}

// ── Restore — admin only ──────────────────────────────────────────────────────

export async function restoreTag(raw: unknown): Promise<ActionResult> {
  try {
    const { supabase, company_id } = await getCompanyContext("admin");
    const { id } = IdInput.parse(raw);

    const { error } = await supabase
      .from("tags")
      .update({ archived_at: null })
      .eq("id", id)
      .eq("company_id", company_id);

    if (error) return fail("INTERNAL", error.message);

    revalidateTaggedPages();
    return { ok: true };
  } catch (e) {
    const handled = handleAuthError(e);
    if (handled) return handled;
    throw e;
  }
}

// ── Delete — admin only, requires usage = 0 ───────────────────────────────────

export async function deleteTag(raw: unknown): Promise<ActionResult> {
  try {
    const { supabase, company_id } = await getCompanyContext("admin");
    const { id } = IdInput.parse(raw);

    const { data: existing } = await supabase
      .from("tags")
      .select("source")
      .eq("id", id)
      .eq("company_id", company_id)
      .maybeSingle();

    if (!existing) return fail("NOT_FOUND", "Label not found.");
    if (existing.source === "department") return fail("FORBIDDEN", "Department labels cannot be deleted.");

    // Block deletion if the tag is still assigned anywhere.
    const [{ count: sopCount }, { count: termCount }] = await Promise.all([
      supabase.from("sop_tags").select("tag_id", { count: "exact", head: true }).eq("tag_id", id),
      supabase.from("glossary_term_tags").select("tag_id", { count: "exact", head: true }).eq("tag_id", id),
    ]);

    const totalUsage = (sopCount ?? 0) + (termCount ?? 0);
    if (totalUsage > 0) {
      return fail(
        "IN_USE",
        `This label is still assigned to ${totalUsage} item${totalUsage === 1 ? "" : "s"}. Archive it first, then remove it from those items before deleting.`,
      );
    }

    const { error } = await supabase
      .from("tags")
      .delete()
      .eq("id", id)
      .eq("company_id", company_id);

    if (error) return fail("INTERNAL", error.message);

    revalidateTaggedPages();
    return { ok: true };
  } catch (e) {
    const handled = handleAuthError(e);
    if (handled) return handled;
    throw e;
  }
}

// ── Assign tags to a glossary term ────────────────────────────────────────────

export async function setGlossaryTermTags(raw: unknown): Promise<ActionResult> {
  try {
    const { supabase, company_id } = await getCompanyContext("manager");
    const { termId, tagIds } = SetTermTagsInput.parse(raw);

    const { data: term } = await supabase
      .from("glossary_terms")
      .select("id")
      .eq("id", termId)
      .eq("company_id", company_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!term) return fail("NOT_FOUND", "Term not found.");

    const { error: delErr } = await supabase
      .from("glossary_term_tags")
      .delete()
      .eq("term_id", termId);

    if (delErr) return fail("INTERNAL", delErr.message);

    if (tagIds.length > 0) {
      const rows = tagIds.map((tag_id) => ({ term_id: termId, tag_id }));
      const { error: insErr } = await supabase.from("glossary_term_tags").insert(rows);
      if (insErr) return fail("INTERNAL", insErr.message);
    }

    revalidatePath("/dashboard/glossary");
    return { ok: true };
  } catch (e) {
    const handled = handleAuthError(e);
    if (handled) return handled;
    throw e;
  }
}

// ── Assign tags to an SOP ─────────────────────────────────────────────────────

export async function setSopTags(raw: unknown): Promise<ActionResult> {
  try {
    const { supabase, company_id } = await getCompanyContext("manager");
    const { sopId, tagIds } = SetSopTagsInput.parse(raw);

    const { data: sop } = await supabase
      .from("sops")
      .select("id")
      .eq("id", sopId)
      .eq("company_id", company_id)
      .maybeSingle();

    if (!sop) return fail("NOT_FOUND", "SOP not found.");

    const { error: delErr } = await supabase
      .from("sop_tags")
      .delete()
      .eq("sop_id", sopId);

    if (delErr) return fail("INTERNAL", delErr.message);

    if (tagIds.length > 0) {
      const rows = tagIds.map((tag_id) => ({ sop_id: sopId, tag_id }));
      const { error: insErr } = await supabase.from("sop_tags").insert(rows);
      if (insErr) return fail("INTERNAL", insErr.message);
    }

    revalidatePath("/dashboard/sops");
    return { ok: true };
  } catch (e) {
    const handled = handleAuthError(e);
    if (handled) return handled;
    throw e;
  }
}
