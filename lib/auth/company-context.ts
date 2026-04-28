import "server-only";

import { auth } from "@clerk/nextjs/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { readImpersonationCookie } from "@/lib/auth/impersonation";
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
  // True when the caller is a super admin operating on this tenant
  // through an active impersonation cookie. Downstream code usually
  // doesn't care — RLS already lets god mode through — but audit
  // logging and the UI banner do.
  impersonating?: boolean;
}

/**
 * Resolves `{ userId, supabase, company_id, role }` for the current request.
 *
 * Throws `AuthError`:
 * - `UNAUTHENTICATED` — no Clerk session
 * - `NO_COMPANY` — Clerk session exists but no `company_members` row
 *   and no active super-admin impersonation session
 * - `FORBIDDEN` — session + company, but role is lower than `required`
 *
 * The `required` parameter enforces a minimum role for manager-only code.
 * `admin` always satisfies any `required` value; `employee` never satisfies
 * `manager`. For pages accessible to any authenticated company member,
 * call without `required`.
 *
 * Super admins are stored in the separate `super_admins` table and are
 * resolved by `getSuperAdminContext()`. When a super admin has started
 * an impersonation session from `/dashboard/platform`, this
 * function transparently returns the impersonated tenant's context
 * with `role: 'admin'` and `impersonating: true`. Every downstream
 * server query sees the impersonated `company_id` and RLS lets the
 * super admin through via the `or is_super_admin()` branch that
 * every tenant policy carries.
 */
export async function getCompanyContext(
  required?: Exclude<Role, "employee">,
): Promise<CompanyContext> {
  const { userId } = await auth();
  if (!userId) throw new AuthError("UNAUTHENTICATED");

  const supabase = await getRequestClient();

  // Impersonation short-circuit. A super admin with a valid cookie
  // operates on the target tenant as if they were its admin. The
  // cookie's signature proves authenticity, but we still re-verify
  // super-admin status every request — a revoked super admin's live
  // cookie must stop working immediately, not at TTL expiry.
  const impersonation = await readImpersonationCookie();
  if (impersonation && impersonation.super_admin_clerk_user_id === userId) {
    const { data: stillSuper } = await supabase.rpc("is_super_admin");
    if (stillSuper) {
      return {
        userId,
        supabase,
        company_id: impersonation.company_id,
        role: "admin",
        impersonating: true,
      };
    }
  }

  const { data: member } = await supabase
    .from("company_members")
    .select("company_id, role, locked_at")
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

  if ((member as { locked_at?: string | null }).locked_at) {
    throw new AuthError("FORBIDDEN", "This account has been locked by an administrator.");
  }

  if (required && role !== "admin" && role !== required) {
    throw new AuthError("FORBIDDEN");
  }

  return { userId, supabase, company_id: member.company_id, role };
}
