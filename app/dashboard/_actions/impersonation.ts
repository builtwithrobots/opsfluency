"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  clearImpersonationCookie,
  readImpersonationCookie,
  setImpersonationCookie,
} from "@/lib/auth/impersonation";
import { getSuperAdminContext } from "@/lib/auth/super-admin-context";
import { getAdminClient } from "@/lib/supabase/admin";

const StartInput = z.object({
  company_id: z.string().uuid(),
});

/**
 * Starts a super-admin impersonation session for the tenant specified
 * by the `company_id` form field.
 *
 * Invoked directly by a `<form action={startImpersonation}>` on the
 * Platform → Tenants page, so the signature is `(FormData) => void`.
 * Every error branch throws — the parent `/dashboard/platform` layout
 * already gates super-admin access, so any failure here is either a
 * race (super admin was revoked between page load and click) or a
 * tampered form body. Both should surface as a server error rather
 * than a silent no-op.
 */
export async function startImpersonation(formData: FormData): Promise<void> {
  // getSuperAdminContext throws AuthError — that's the right behavior
  // here since the parent layout already guarantees super-admin access.
  const { userId: superAdminUserId } = await getSuperAdminContext();

  const parsed = StartInput.parse({
    company_id: formData.get("company_id"),
  });

  // Service-role client bypasses RLS. Required here because the audit
  // log table has `revoke all from anon, authenticated` and because
  // we want the existence check + insert to succeed regardless of
  // the caller's own tenant scoping.
  const admin = getAdminClient();

  const { data: company, error: companyError } = await admin
    .from("companies")
    .select("id")
    .eq("id", parsed.company_id)
    .maybeSingle();
  if (companyError) throw companyError;
  if (!company) throw new Error(`Company ${parsed.company_id} not found`);

  const { error: logError } = await admin.from("impersonation_events").insert({
    super_admin_clerk_user_id: superAdminUserId,
    company_id: parsed.company_id,
    action: "start",
  });
  if (logError) throw logError;

  await setImpersonationCookie(parsed.company_id, superAdminUserId);
  redirect("/dashboard");
}

/**
 * Ends the current impersonation session. Logs the stop event, clears
 * the cookie, and bounces back to the Platform → Tenants list. Safe to
 * call when no session is active (becomes a no-op).
 */
export async function stopImpersonation() {
  const payload = await readImpersonationCookie();
  if (payload) {
    const admin = getAdminClient();
    // Non-fatal on error — we still want to clear the cookie so the
    // super admin exits god mode even if the audit write fails.
    await admin.from("impersonation_events").insert({
      super_admin_clerk_user_id: payload.super_admin_clerk_user_id,
      company_id: payload.company_id,
      action: "stop",
    });
  }
  await clearImpersonationCookie();
  redirect("/dashboard/platform/tenants");
}
