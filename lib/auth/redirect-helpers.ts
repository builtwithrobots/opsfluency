import "server-only";

import { redirect } from "next/navigation";

import { AuthError, getCompanyContext } from "@/lib/auth/company-context";
import type { CompanyContext, Role } from "@/lib/auth/company-context";
import { isCurrentUserSuperAdmin } from "@/lib/auth/super-admin-context";

/**
 * Wraps `getCompanyContext()` for use in page Server Components.
 *
 * Super admins have no `company_members` row. Without an active
 * impersonation cookie, `getCompanyContext()` throws `NO_COMPANY` for
 * them. That's the right behaviour for Server Actions (which return an
 * error envelope), but a page should redirect them to their own
 * landing instead of showing an error boundary.
 *
 * Do NOT use in Server Actions — those return `{ ok: false, error }`;
 * they should catch `AuthError` and return the envelope normally.
 */
export async function getCompanyContextOrPlatform(
  required?: Exclude<Role, "employee">,
): Promise<CompanyContext> {
  try {
    return await getCompanyContext(required);
  } catch (e) {
    if (e instanceof AuthError && e.code === "NO_COMPANY") {
      if (await isCurrentUserSuperAdmin()) redirect("/dashboard/platform");
    }
    throw e;
  }
}
