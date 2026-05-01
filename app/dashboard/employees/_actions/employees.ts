"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCompanyContext } from "@/lib/auth/company-context";
import { normalizePhone } from "@/lib/employees/phone";

export type InviteResult =
  | { ok: true; inviteId: string; token: string }
  | { ok: false; error: { code: string; message?: string } };

const optionalEmail = z.union([z.string().email(), z.literal("")]).optional();

const CreateInviteInput = z.object({
  name: z.string().max(100).optional(),
  email_work: optionalEmail,
  email_personal: optionalEmail,
  department_ids: z.array(z.string().uuid()).default([]),
});

export async function createInvite(formData: FormData): Promise<InviteResult> {
  const { supabase, company_id, userId } = await getCompanyContext("manager");

  const rawPhone = (formData.get("phone") as string | null)?.trim() ?? "";
  const phone = normalizePhone(rawPhone);
  if (!phone) {
    return { ok: false, error: { code: "INVALID_PHONE", message: "Enter a valid US phone number." } };
  }

  let parsed;
  try {
    parsed = CreateInviteInput.parse({
      name: (formData.get("name") as string | null) || undefined,
      email_work: (formData.get("email_work") as string | null) || undefined,
      email_personal: (formData.get("email_personal") as string | null) || undefined,
      department_ids: (formData.getAll("department_ids") as string[]).filter(Boolean),
    });
  } catch {
    return { ok: false, error: { code: "INVALID_INPUT" } };
  }

  const personalInviteToken = crypto.randomUUID();
  const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: invite, error } = await supabase.from("employee_invites").insert({
    company_id,
    phone,
    name: parsed.name ?? null,
    email_work: parsed.email_work || null,
    email_personal: parsed.email_personal || null,
    department_ids: parsed.department_ids,
    invited_by: userId,
    personal_invite_token: personalInviteToken,
    personal_invite_token_expires_at: tokenExpiresAt,
  }).select("id").single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: { code: "DUPLICATE_PHONE", message: "An invite for that number already exists." } };
    }
    return { ok: false, error: { code: "INTERNAL", message: error.message } };
  }

  revalidatePath("/dashboard/employees");
  return { ok: true, inviteId: invite.id, token: personalInviteToken };
}

const DeleteInviteInput = z.object({ id: z.string().uuid() });

export async function deleteInvite(formData: FormData): Promise<void> {
  const { supabase, company_id } = await getCompanyContext("manager");
  const { id } = DeleteInviteInput.parse({ id: formData.get("id") });

  await supabase
    .from("employee_invites")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id)
    .is("claimed_at", null);

  revalidatePath("/dashboard/employees");
}
