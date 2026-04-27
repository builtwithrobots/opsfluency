"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminClient } from "@/lib/supabase/admin";
import { getSuperAdminContext } from "@/lib/auth/super-admin-context";
import { AuthError } from "@/lib/auth/company-context";

const Input = z.object({ companyId: z.string().uuid() });

export async function deleteTenantAiHistory(
  companyId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await getSuperAdminContext();

    const { companyId: id } = Input.parse({ companyId });

    // ai_call_log is REVOKE'd from anon + authenticated — must use admin client.
    const admin = getAdminClient();
    const { error } = await admin.from("ai_call_log").delete().eq("company_id", id);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/dashboard/platform");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: "Invalid company ID" };
    if (e instanceof AuthError) return { ok: false, error: e.code };
    throw e;
  }
}
