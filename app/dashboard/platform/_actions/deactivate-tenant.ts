"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSuperAdminContext } from "@/lib/auth/super-admin-context";
import { getAdminClient } from "@/lib/supabase/admin";

const Input = z.object({
  company_id: z.string().uuid(),
});

export type DeactivateTenantResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Soft-deactivate a tenant by setting companies.deactivated_at = NOW().
 * All data is preserved. Every company member's next getCompanyContext()
 * call will throw COMPANY_DEACTIVATED and block access.
 */
export async function deactivateTenant(formData: FormData): Promise<DeactivateTenantResult> {
  try {
    await getSuperAdminContext();
    const { company_id } = Input.parse({ company_id: formData.get("company_id") });

    const admin = getAdminClient();
    const { error } = await admin
      .from("companies")
      .update({ deactivated_at: new Date().toISOString() })
      .eq("id", company_id)
      .is("deactivated_at", null);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/dashboard/platform");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: "Invalid company ID." };
    return { ok: false, error: e instanceof Error ? e.message : "Deactivation failed." };
  }
}

/**
 * Reactivate a previously deactivated tenant by clearing deactivated_at.
 * Returns void so it can be used directly as a <form action>.
 */
export async function reactivateTenant(formData: FormData): Promise<void> {
  await getSuperAdminContext();
  const { company_id } = Input.parse({ company_id: formData.get("company_id") });

  const admin = getAdminClient();
  const { error } = await admin
    .from("companies")
    .update({ deactivated_at: null })
    .eq("id", company_id)
    .not("deactivated_at", "is", null);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/platform");
}
