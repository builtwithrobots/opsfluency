import "server-only";

import { auth } from "@clerk/nextjs/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getRequestClient } from "@/lib/supabase/server";

export type Role = "admin" | "manager" | "worker";

export type AuthErrorCode =
  | "UNAUTHENTICATED"
  | "NO_COMPANY"
  | "FORBIDDEN";

export class AuthError extends Error {
  constructor(public code: AuthErrorCode) {
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
 * `admin` always satisfies any `required` value; `worker` never satisfies
 * `manager`. For pages accessible to any authenticated company member,
 * call without `required`.
 */
export async function getCompanyContext(
  required?: Exclude<Role, "worker">,
): Promise<CompanyContext> {
  const { userId } = await auth();
  if (!userId) throw new AuthError("UNAUTHENTICATED");

  const supabase = await getRequestClient(userId);

  const { data: member } = await supabase
    .from("company_members")
    .select("company_id, role")
    .eq("clerk_user_id", userId)
    .single();

  if (!member) throw new AuthError("NO_COMPANY");

  const role = member.role as Role;

  if (required && role !== "admin" && role !== required) {
    throw new AuthError("FORBIDDEN");
  }

  return { userId, supabase, company_id: member.company_id, role };
}
