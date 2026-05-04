"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { AuthError, getCompanyContext } from "@/lib/auth/company-context";

type ActionResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: { code: string; message?: string; details?: unknown } };

function fail(code: string, message?: string): { ok: false; error: { code: string; message?: string } } {
  return { ok: false, error: { code, message } };
}

const ContactSchema = z.object({
  name:      z.string().min(1).max(100),
  title:     z.string().min(1).max(100),
  email:     z.string().email().nullable().optional(),
  phone:     z.string().max(30).nullable().optional(),
  photo_url: z.string().url().max(2048).nullable().optional(),
  sort_order: z.number().int().default(0),
});

export async function createHrContact(raw: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, company_id } = await getCompanyContext("admin");
    const input = ContactSchema.parse(raw);

    const { data, error } = await supabase
      .from("hr_contacts")
      .insert({ ...input, company_id })
      .select("id")
      .single();

    if (error) return fail("INTERNAL", error.message);
    revalidatePath("/dashboard/hr-contacts");
    return { ok: true, data: { id: data.id } };
  } catch (e) {
    if (e instanceof z.ZodError) return fail("INVALID_INPUT");
    if (e instanceof AuthError) return fail(e.code);
    throw e;
  }
}

export async function updateHrContact(id: string, raw: unknown): Promise<ActionResult> {
  try {
    const { supabase, company_id } = await getCompanyContext("admin");
    const input = ContactSchema.partial().parse(raw);

    const { error } = await supabase
      .from("hr_contacts")
      .update(input)
      .eq("id", id)
      .eq("company_id", company_id);

    if (error) return fail("INTERNAL", error.message);
    revalidatePath("/dashboard/hr-contacts");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return fail("INVALID_INPUT");
    if (e instanceof AuthError) return fail(e.code);
    throw e;
  }
}

export async function deleteHrContact(id: string): Promise<ActionResult> {
  try {
    const { supabase, company_id } = await getCompanyContext("admin");

    const { error } = await supabase
      .from("hr_contacts")
      .delete()
      .eq("id", id)
      .eq("company_id", company_id);

    if (error) return fail("INTERNAL", error.message);
    revalidatePath("/dashboard/hr-contacts");
    return { ok: true };
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code);
    throw e;
  }
}
