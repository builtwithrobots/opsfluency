"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCompanyContext } from "@/lib/auth/company-context";
import { getAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/employees/phone";

// ─── Update invite ────────────────────────────────────────────────────────────

export type UpdateInviteResult =
  | { ok: true }
  | { ok: false; error: { code: string; message?: string } };

const optionalEmail = z.union([z.string().email(), z.literal("")]).optional();

const UpdateInviteInput = z.object({
  invite_id: z.string().uuid(),
  name: z.string().max(100).optional(),
  email_work: optionalEmail,
  email_personal: optionalEmail,
  department_ids: z.array(z.string().uuid()).default([]),
});

export async function updateInvite(
  _prev: UpdateInviteResult | null,
  formData: FormData,
): Promise<UpdateInviteResult> {
  try {
    const { supabase, company_id } = await getCompanyContext("manager");

    const rawPhone = (formData.get("phone") as string | null)?.trim() ?? "";
    const phone = normalizePhone(rawPhone);
    if (!phone) {
      return { ok: false, error: { code: "INVALID_PHONE", message: "Enter a valid US phone number." } };
    }

    const parsed = UpdateInviteInput.parse({
      invite_id: formData.get("invite_id"),
      name: (formData.get("name") as string | null) || undefined,
      email_work: (formData.get("email_work") as string | null) || undefined,
      email_personal: (formData.get("email_personal") as string | null) || undefined,
      department_ids: (formData.getAll("department_ids") as string[]).filter(Boolean),
    });

    const { error } = await supabase
      .from("employee_invites")
      .update({
        phone,
        name: parsed.name ?? null,
        email_work: parsed.email_work || null,
        email_personal: parsed.email_personal || null,
        department_ids: parsed.department_ids,
      })
      .eq("id", parsed.invite_id)
      .eq("company_id", company_id)
      .is("claimed_at", null);

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: { code: "DUPLICATE_PHONE", message: "An invite for that number already exists." } };
      }
      return { ok: false, error: { code: "INTERNAL", message: error.message } };
    }

    revalidatePath("/dashboard/employees");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { ok: false, error: { code: "INVALID_INPUT", message: e.issues[0]?.message } };
    }
    throw e;
  }
}

// ─── Update active employee ───────────────────────────────────────────────────

export type UpdateEmployeeResult =
  | { ok: true }
  | { ok: false; error: { code: string; message?: string } };

const UpdateEmployeeInput = z.object({
  member_id: z.string().uuid(),
  clerk_user_id: z.string().min(1),
  first_name: z.string().max(100),
  last_name: z.string().max(100),
  role: z.enum(["employee", "manager"]),
  department_ids: z.array(z.string().uuid()).default([]),
});

export async function updateEmployee(
  _prev: UpdateEmployeeResult | null,
  formData: FormData,
): Promise<UpdateEmployeeResult> {
  try {
    // Auth check via RLS client; writes use admin client because
    // company_members has no UPDATE policy for the authenticated role.
    const { supabase, company_id } = await getCompanyContext("manager");
    const admin = getAdminClient();

    const parsed = UpdateEmployeeInput.parse({
      member_id: formData.get("member_id"),
      clerk_user_id: formData.get("clerk_user_id"),
      first_name: (formData.get("first_name") as string | null)?.trim() ?? "",
      last_name: (formData.get("last_name") as string | null)?.trim() ?? "",
      role: formData.get("role"),
      department_ids: (formData.getAll("department_ids") as string[]).filter(Boolean),
    });

    // Verify member belongs to this company before mutating.
    const { data: member } = await supabase
      .from("company_members")
      .select("id")
      .eq("id", parsed.member_id)
      .eq("company_id", company_id)
      .single();

    if (!member) {
      return { ok: false, error: { code: "NOT_FOUND" } };
    }

    // Update Clerk display name
    const clerk = await clerkClient();
    await clerk.users.updateUser(parsed.clerk_user_id, {
      firstName: parsed.first_name || undefined,
      lastName: parsed.last_name || undefined,
    });

    // Update role (admin client required — no UPDATE policy on company_members)
    await admin
      .from("company_members")
      .update({ role: parsed.role })
      .eq("id", parsed.member_id)
      .eq("company_id", company_id);

    // Replace department assignments atomically (employee_departments has FOR ALL)
    await supabase
      .from("employee_departments")
      .delete()
      .eq("member_id", parsed.member_id)
      .eq("company_id", company_id);

    if (parsed.department_ids.length > 0) {
      await supabase.from("employee_departments").insert(
        parsed.department_ids.map((department_id) => ({
          company_id,
          department_id,
          member_id: parsed.member_id,
        })),
      );
    }

    revalidatePath("/dashboard/employees");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { ok: false, error: { code: "INVALID_INPUT", message: e.issues[0]?.message } };
    }
    throw e;
  }
}

// ─── Remove active employee ───────────────────────────────────────────────────

export type RemoveEmployeeResult =
  | { ok: true }
  | { ok: false; error: { code: string; message?: string } };

const RemoveEmployeeInput = z.object({
  member_id: z.string().uuid(),
});

export async function removeEmployee(
  _prev: RemoveEmployeeResult | null,
  formData: FormData,
): Promise<RemoveEmployeeResult> {
  try {
    // Auth check via RLS client; delete uses admin client because
    // company_members has no DELETE policy for the authenticated role.
    const { supabase, company_id } = await getCompanyContext("manager");
    const admin = getAdminClient();

    const { member_id } = RemoveEmployeeInput.parse({
      member_id: formData.get("member_id"),
    });

    // Verify member belongs to this company before bypassing RLS.
    const { data: target } = await supabase
      .from("company_members")
      .select("id, role")
      .eq("id", member_id)
      .eq("company_id", company_id)
      .single();

    if (!target) {
      return { ok: false, error: { code: "NOT_FOUND" } };
    }

    const { error } = await admin
      .from("company_members")
      .delete()
      .eq("id", member_id)
      .eq("company_id", company_id);

    if (error) {
      return { ok: false, error: { code: "INTERNAL", message: error.message } };
    }

    revalidatePath("/dashboard/employees");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { ok: false, error: { code: "INVALID_INPUT", message: e.issues[0]?.message } };
    }
    throw e;
  }
}
