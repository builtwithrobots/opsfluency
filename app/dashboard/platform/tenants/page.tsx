import { redirect } from "next/navigation";

import { startImpersonation } from "@/app/dashboard/_actions/impersonation";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { AuthError } from "@/lib/auth/company-context";
import { getSuperAdminContext } from "@/lib/auth/super-admin-context";

interface TenantRow {
  id: string;
  name: string;
  phone: string | null;
  created_at: string;
  member_count: number;
}

async function loadTenants(): Promise<TenantRow[]> {
  const { supabase } = await getSuperAdminContext();

  // RLS lets the super admin read every company via the
  // `or is_super_admin()` branch on `companies_self_read`, and every
  // member row via `company_members_self_read`.
  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, name, phone, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!companies) return [];

  const { data: members, error: memberError } = await supabase
    .from("company_members")
    .select("company_id");
  if (memberError) throw memberError;

  const counts = new Map<string, number>();
  for (const m of members ?? []) {
    counts.set(m.company_id, (counts.get(m.company_id) ?? 0) + 1);
  }

  return companies.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    created_at: c.created_at,
    member_count: counts.get(c.id) ?? 0,
  }));
}

export default async function TenantsPage() {
  let tenants: TenantRow[];
  try {
    tenants = await loadTenants();
  } catch (e) {
    // Non-super-admins landing here get bounced to the dashboard home.
    if (e instanceof AuthError && e.code === "FORBIDDEN") redirect("/dashboard");
    if (e instanceof AuthError && e.code === "UNAUTHENTICATED") redirect("/sign-in");
    throw e;
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-xs font-medium tracking-[0.15em] text-(--color-brand) uppercase">
          Platform
        </p>
        <Heading className="font-display mt-2">Tenants</Heading>
        <Text className="mt-2 max-w-2xl">
          Every company in the system. Click <strong>Impersonate</strong> to
          temporarily operate as that tenant&apos;s admin — useful for
          reproducing customer bugs and sanity-checking the manager UX.
          Every start and stop is recorded in the audit log.
        </Text>
      </header>

      {tenants.length > 0 ? (
        <ul className="divide-y divide-[color:var(--dc-edge)] overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
          {tenants.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-base font-medium text-dc-text">{t.name}</p>
                <p className="mt-1 text-sm text-dc-text-2">
                  {t.member_count} member{t.member_count === 1 ? "" : "s"}
                  {" · "}
                  {t.phone ?? "no phone"}
                  {" · "}
                  created {new Date(t.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <code className="font-mono text-xs text-dc-text-3">{t.id}</code>
                <form action={startImpersonation}>
                  <input type="hidden" name="company_id" value={t.id} />
                  <button
                    type="submit"
                    className="rounded-md border border-(--color-brand)/30 bg-(--color-brand)/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-(--color-brand) uppercase hover:bg-(--color-brand)/20"
                  >
                    Impersonate
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-16 text-center">
          <p className="text-dc-text-2">No tenants yet.</p>
          <p className="mt-1 text-sm text-dc-text-3">
            The first company shows up here after a user completes onboarding.
          </p>
        </div>
      )}
    </div>
  );
}
