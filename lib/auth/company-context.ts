import "server-only";

import { auth } from "@clerk/nextjs/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getAdminClient } from "@/lib/supabase/admin";
import { getRequestClient } from "@/lib/supabase/server";

export type Role = "admin" | "manager" | "employee";

export type AuthErrorCode =
  | "UNAUTHENTICATED"
  | "NO_COMPANY"
  | "FORBIDDEN"
  | "AUTH_BRIDGE_FAILED";

export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    public detail?: string,
  ) {
    super(code);
    this.name = "AuthError";
  }
}

export interface CompanyContext {
  userId: string;
  supabase: SupabaseClient;
  company_id: string;
  role: Role;
}

/**
 * Resolves `{ userId, supabase, company_id, role }` for the current request.
 *
 * Throws `AuthError`:
 * - `UNAUTHENTICATED` — no Clerk session
 * - `NO_COMPANY` — Clerk session exists but no `company_members` row
 * - `FORBIDDEN` — session + company, but role is lower than `required`
 *
 * The `required` parameter enforces a minimum role for manager-only code.
 * `admin` always satisfies any `required` value; `employee` never satisfies
 * `manager`. For pages accessible to any authenticated company member,
 * call without `required`.
 *
 * Super admins are stored in the separate `super_admins` table and are
 * resolved by `getSuperAdminContext()` (not yet implemented — add when the
 * first super-admin-only route lands).
 */
export async function getCompanyContext(
  required?: Exclude<Role, "employee">,
): Promise<CompanyContext> {
  const { userId } = await auth();
  if (!userId) throw new AuthError("UNAUTHENTICATED");

  const supabase = await getRequestClient();

  const { data: member } = await supabase
    .from("company_members")
    .select("company_id, role")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!member) {
    // Distinguish "row doesn't exist" from "row exists but RLS is hiding it."
    // The latter happens when Supabase isn't trusting the Clerk JWT — most
    // commonly because Third-party Auth → Clerk isn't configured in the
    // Supabase dashboard, or the configured Clerk domain doesn't match the
    // JWT's `iss` claim. Admin client bypasses RLS, so if it finds the row
    // the bridge is the problem; if not, onboarding genuinely hasn't run.
    const admin = getAdminClient();
    const { data: adminMember } = await admin
      .from("company_members")
      .select("company_id, role")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (adminMember) {
      throw new AuthError(
        "AUTH_BRIDGE_FAILED",
        `company_members row exists for ${userId} but is not visible via the user's Clerk JWT. Check Supabase → Authentication → Third-party Auth → Clerk.`,
      );
    }

    throw new AuthError("NO_COMPANY");
  }

  const role = member.role as Role;

  if (required && role !== "admin" && role !== required) {
    throw new AuthError("FORBIDDEN");
  }

  return { userId, supabase, company_id: member.company_id, role };
}
