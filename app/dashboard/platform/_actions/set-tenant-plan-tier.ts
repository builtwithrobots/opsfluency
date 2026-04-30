"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminClient } from "@/lib/supabase/admin";
import { getSuperAdminContext } from "@/lib/auth/super-admin-context";
import { AuthError } from "@/lib/auth/company-context";
import type { PlanTier } from "@/lib/types/billing";

const Input = z.object({
  companyId: z.string().uuid(),
  planTier: z.enum(["starter", "growth", "scale", "enterprise"]),
});

export async function setTenantPlanTier(
  companyId: string,
  planTier: PlanTier,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await getSuperAdminContext();

    const { companyId: id, planTier: tier } = Input.parse({ companyId, planTier });

    const admin = getAdminClient();
    const { error } = await admin
      .from("companies")
      .update({ plan_tier: tier })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/dashboard/platform");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: "Invalid input" };
    if (e instanceof AuthError) return { ok: false, error: e.code };
    throw e;
  }
}
