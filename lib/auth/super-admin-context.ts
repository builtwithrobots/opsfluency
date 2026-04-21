import "server-only";

import { auth } from "@clerk/nextjs/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getRequestClient } from "@/lib/supabase/server";

import { AuthError } from "./company-context";

export interface SuperAdminContext {
  userId: string;
  supabase: SupabaseClient;
}

/**
 * Resolves `{ userId, supabase }` for a super-admin caller.
 *
 * Throws `AuthError`:
 * - `UNAUTHENTICATED` — no Clerk session
 * - `FORBIDDEN` — signed in, but `clerk_user_id` is not in `super_admins`
 *
 * The returned Supabase client is the request-scoped JWT client. Super
 * admins read every tenant's data through the `or is_super_admin()`
 * branch on every tenant RLS policy — not through the service-role
 * client. Writes that aren't covered by a policy (e.g. creating a
 * tenant from the god-mode UI) still have to go through the admin
 * client.
 */
export async function getSuperAdminContext(): Promise<SuperAdminContext> {
  const { userId } = await auth();
  if (!userId) throw new AuthError("UNAUTHENTICATED");

  const supabase = await getRequestClient();
  if (!(await isSuperAdminViaRpc(supabase))) {
    throw new AuthError("FORBIDDEN");
  }

  return { userId, supabase };
}

/**
 * Non-throwing probe: `true` when the current Clerk session belongs to a
 * super admin. Used by routing code (home CTA, onboarding bypass,
 * dashboard layout fallback) where "not a super admin" is a normal
 * branch, not an error.
 */
export async function isCurrentUserSuperAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const supabase = await getRequestClient();
  return isSuperAdminViaRpc(supabase);
}

// `super_admins` has `REVOKE ALL FROM anon, authenticated` — the JWT
// client can't SELECT it. Go through the SECURITY DEFINER helper via
// RPC, which is granted to authenticated.
async function isSuperAdminViaRpc(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_super_admin");
  if (error) throw error;
  return Boolean(data);
}
