"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AuthError, getCompanyContext } from "@/lib/auth/company-context";
import { TAG_NAME_MAX, TAG_COLORS, type Tag } from "@/lib/types/tags";

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

const CreateTagInput = z.object({
  name_en: z.string().trim().min(1, "Required").max(TAG_NAME_MAX),
  name_es: z.string().trim().min(1, "Required").max(TAG_NAME_MAX),
  color: z.string().refine((c) => tagColors.includes(c), { message: "Invalid color" }),
});

const DeleteTagInput = z.object({ id: z.string().uuid() });

const SetTermTagsInput = z.object({
  termId: z.string().uuid(),
  tagIds: z.array(z.string().uuid()),
});

const SetSopTagsInput = z.object({
  sopId: z.string().uuid(),
  tagIds: z.array(z.string().uuid()),
});

const PG_UNIQUE_VIOLATION = "23505";

// ── List ──────────────────────────────────────────────────────────────────────

export async function listTags(): Promise<ActionResult<Tag[]>> {
  try {
    const { supabase, company_id } = await getCompanyContext("manager");

    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("company_id", company_id)
      .order("source", { ascending: false }) // 'department' before 'custom'
      .order("name_en", { ascending: true });

    if (error) return fail("INTERNAL", error.message);
    return { ok: true, data: (data ?? []) as Tag[] };
  } catch (e) {
    const handled = handleAuthError<Tag[]>(e);
    if (handled) return handled;
    throw e;
  }
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createTag(raw: unknown): Promise<ActionResult<Tag>> {
  try {
    const { supabase, company_id } = await getCompanyContext("manager");
    const parsed = CreateTagInput.parse(raw);

    const { data, error } = await supabase
      .from("tags")
      .insert({
        company_id,
        name_en: parsed.name_en,
        name_es: parsed.name_es,
        color: parsed.color,
        source: "custom",
      })
      .select()
      .single();

    if (error) {
      if (error.code === PG_UNIQUE_VIOLATION) {
        return fail(
          "DUPLICATE_TAG",
          `A tag named "${parsed.name_en}" already exists.`,
        );
      }
      return fail("INTERNAL", error.message);
    }

    revalidatePath("/dashboard/glossary");
    revalidatePath("/dashboard/sops");
    return { ok: true, data: data as Tag };
  } catch (e) {
    const handled = handleAuthError<Tag>(e);
    if (handled) return handled;
    throw e;
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteTag(raw: unknown): Promise<ActionResult> {
  try {
    const { supabase, company_id } = await getCompanyContext("manager");
    const { id } = DeleteTagInput.parse(raw);

    // Read source first — department tags cannot be deleted.
    const { data: existing } = await supabase
      .from("tags")
      .select("source")
      .eq("id", id)
      .eq("company_id", company_id)
      .maybeSingle();

    if (!existing) return fail("NOT_FOUND", "Tag not found.");
    if (existing.source === "department") {
      return fail("FORBIDDEN", "Department tags cannot be deleted.");
    }

    const { error } = await supabase
      .from("tags")
      .delete()
      .eq("id", id)
      .eq("company_id", company_id);

    if (error) return fail("INTERNAL", error.message);

    revalidatePath("/dashboard/glossary");
    revalidatePath("/dashboard/sops");
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

    // Confirm the term belongs to this company.
    const { data: term } = await supabase
      .from("glossary_terms")
      .select("id")
      .eq("id", termId)
      .eq("company_id", company_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!term) return fail("NOT_FOUND", "Term not found.");

    // Delete existing assignments, then insert the new set.
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

    // Confirm the SOP belongs to this company.
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
