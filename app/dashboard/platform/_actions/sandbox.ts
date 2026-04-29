"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { setImpersonationCookie } from "@/lib/auth/impersonation";
import { getSuperAdminContext } from "@/lib/auth/super-admin-context";
import { getAdminClient } from "@/lib/supabase/admin";

async function bootstrapSandbox(userId: string): Promise<string> {
  const admin = getAdminClient();
  const { data, error } = await admin.rpc("bootstrap_sandbox_company", {
    p_admin_clerk_user_id: userId,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) throw new Error("bootstrap_sandbox_company returned no row");
  return row.id as string;
}

/**
 * Opens the current super admin's personal sandbox (creates one if it
 * doesn't exist yet), then starts an impersonation session so they land
 * in the full manager dashboard scoped to the sandbox tenant.
 */
export async function openSandbox(): Promise<void> {
  const { userId } = await getSuperAdminContext();
  const companyId = await bootstrapSandbox(userId);

  const admin = getAdminClient();
  // Audit the impersonation the same way startImpersonation() does so the
  // impersonation-tab audit log captures sandbox sessions too.
  await admin.from("impersonation_events").insert({
    super_admin_clerk_user_id: userId,
    company_id: companyId,
    action: "start",
  });

  await setImpersonationCookie(companyId, userId);
  redirect("/dashboard");
}

/**
 * Wipes the sandbox and recreates it as a fresh empty company with default
 * departments. All data accumulated during the previous session is deleted.
 */
export async function resetSandbox(formData: FormData): Promise<void> {
  const { userId } = await getSuperAdminContext();
  const { company_id } = z
    .object({ company_id: z.string().uuid() })
    .parse({ company_id: formData.get("company_id") });

  const admin = getAdminClient();
  const { error } = await admin.rpc("delete_sandbox_company", {
    p_company_id: company_id,
  });
  if (error) throw error;

  await bootstrapSandbox(userId);
  revalidatePath("/dashboard/platform");
}
