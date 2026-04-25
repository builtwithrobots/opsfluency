"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AuthError, getCompanyContext } from "@/lib/auth/company-context";
import {
  GLOSSARY_DEFINITION_MAX,
  GLOSSARY_TERM_MAX,
} from "@/lib/types/glossary";

/**
 * Glossary CRUD. Mirrors the ActionResult envelope used by
 * `app/dashboard/sops/_actions.ts` so the dialog UI can branch on a
 * typed error code (e.g. RESTORE_CONFLICT, DUPLICATE_TERM).
 *
 * `archive` and `restore` are soft-delete operations. The DB partial
 * unique index `glossary_terms_active_company_term_lower_idx`
 * (migration 20260425000002) is what actually enforces uniqueness on
 * the active set — we map its 23505 violation to a typed error here so
 * the dialog can surface a useful message instead of a generic 500.
 */

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

const trimmedRequired = (max: number) =>
  z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, { message: "Required" })
    .refine((s) => s.length <= max, { message: `Max ${max} characters` });

const trimmedOptional = (max: number) =>
  z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length <= max, { message: `Max ${max} characters` })
    .transform((s) => (s.length === 0 ? null : s))
    .nullable();

const CreateInput = z.object({
  term_en: trimmedRequired(GLOSSARY_TERM_MAX),
  term_es: trimmedRequired(GLOSSARY_TERM_MAX),
  definition_en: trimmedOptional(GLOSSARY_DEFINITION_MAX),
  definition_es: trimmedOptional(GLOSSARY_DEFINITION_MAX),
});

const UpdateInput = CreateInput.extend({
  id: z.string().uuid(),
});

const IdInput = z.object({ id: z.string().uuid() });

const PG_UNIQUE_VIOLATION = "23505";

export async function createGlossaryTerm(
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, company_id, userId } = await getCompanyContext("manager");
    const parsed = CreateInput.parse(raw);

    const { data, error } = await supabase
      .from("glossary_terms")
      .insert({
        company_id,
        term_en: parsed.term_en,
        term_es: parsed.term_es,
        definition_en: parsed.definition_en,
        definition_es: parsed.definition_es,
        created_by: userId,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === PG_UNIQUE_VIOLATION) {
        return fail(
          "DUPLICATE_TERM",
          `"${parsed.term_en}" already exists in your glossary. Edit the existing entry instead.`,
        );
      }
      return fail("INTERNAL", error.message);
    }

    revalidatePath("/dashboard/glossary");
    return { ok: true, data: { id: data.id } };
  } catch (e) {
    const handled = handleAuthError<{ id: string }>(e);
    if (handled) return handled;
    throw e;
  }
}

export async function updateGlossaryTerm(raw: unknown): Promise<ActionResult> {
  try {
    const { supabase, company_id } = await getCompanyContext("manager");
    const parsed = UpdateInput.parse(raw);

    const { data, error } = await supabase
      .from("glossary_terms")
      .update({
        term_en: parsed.term_en,
        term_es: parsed.term_es,
        definition_en: parsed.definition_en,
        definition_es: parsed.definition_es,
      })
      .eq("id", parsed.id)
      .eq("company_id", company_id)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      if (error.code === PG_UNIQUE_VIOLATION) {
        return fail(
          "DUPLICATE_TERM",
          `Another active term with the English spelling "${parsed.term_en}" already exists.`,
        );
      }
      return fail("INTERNAL", error.message);
    }
    if (!data) return fail("NOT_FOUND", "This term has been archived or removed.");

    revalidatePath("/dashboard/glossary");
    return { ok: true };
  } catch (e) {
    const handled = handleAuthError(e);
    if (handled) return handled;
    throw e;
  }
}

export async function archiveGlossaryTerm(raw: unknown): Promise<ActionResult> {
  try {
    const { supabase, company_id } = await getCompanyContext("manager");
    const { id } = IdInput.parse(raw);

    const { data, error } = await supabase
      .from("glossary_terms")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("company_id", company_id)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();

    if (error) return fail("INTERNAL", error.message);
    if (!data) return fail("NOT_FOUND", "This term is already archived.");

    revalidatePath("/dashboard/glossary");
    return { ok: true };
  } catch (e) {
    const handled = handleAuthError(e);
    if (handled) return handled;
    throw e;
  }
}

export async function restoreGlossaryTerm(raw: unknown): Promise<ActionResult> {
  try {
    const { supabase, company_id } = await getCompanyContext("manager");
    const { id } = IdInput.parse(raw);

    const { data, error } = await supabase
      .from("glossary_terms")
      .update({ deleted_at: null })
      .eq("id", id)
      .eq("company_id", company_id)
      .not("deleted_at", "is", null)
      .select("id")
      .maybeSingle();

    if (error) {
      if (error.code === PG_UNIQUE_VIOLATION) {
        return fail(
          "RESTORE_CONFLICT",
          "An active term with the same English spelling already exists. Edit the active one instead, or archive it first.",
        );
      }
      return fail("INTERNAL", error.message);
    }
    if (!data) return fail("NOT_FOUND", "This term is already active.");

    revalidatePath("/dashboard/glossary");
    return { ok: true };
  } catch (e) {
    const handled = handleAuthError(e);
    if (handled) return handled;
    throw e;
  }
}
