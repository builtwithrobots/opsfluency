import "server-only";

import { getAdminClient } from "@/lib/supabase/admin";

/**
 * Creates a company + admin member + the four default departments in a
 * single Postgres transaction via the `bootstrap_company` RPC.
 *
 * Called from the admin-signup Server Action (or a Clerk webhook) using
 * the service-role client — the caller has no `company_members` row yet,
 * so RLS has nothing to scope to. The RPC itself runs with
 * `security definer` and is REVOKE'd from anon/authenticated, so the only
 * valid invocation path is the service-role client.
 */
export interface BootstrapCompanyInput {
  name: string;
  phone?: string | null;
  logoUrl?: string | null;
  adminClerkUserId: string;
}

export interface BootstrappedCompany {
  id: string;
  name: string;
  phone: string | null;
  logo_url: string | null;
  created_at: string;
}

export async function bootstrapCompany(
  input: BootstrapCompanyInput,
): Promise<BootstrappedCompany> {
  // Admin client: signup runs before the caller has a company_members
  // row, so RLS must be bypassed exactly here and nowhere else.
  const supabase = getAdminClient();

  const { data, error } = await supabase.rpc("bootstrap_company", {
    p_name: input.name,
    p_phone: input.phone ?? null,
    p_logo_url: input.logoUrl ?? null,
    p_admin_clerk_user_id: input.adminClerkUserId,
  });

  if (error) throw error;

  // supabase-js deserializes a composite-typed RPC (`returns companies`)
  // as either the row object or a single-element array depending on the
  // driver version. Normalize defensively so callers always see the row.
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("bootstrap_company returned no row");
  }
  return row as BootstrappedCompany;
}
