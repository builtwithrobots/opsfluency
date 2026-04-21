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

  // RLS allows the super admin to read every company via the
  // `or is_super_admin()` branch on `companies_self_read`. Same for
  // `company_members_self_read`, which we use for a membership count.
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

export default async function SuperAdminPage() {
  const tenants = await loadTenants();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-xs font-medium tracking-[0.15em] text-(--color-brand) uppercase">
          God mode
        </p>
        <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-dc-text md:text-4xl">
          Tenants
        </h1>
        <p className="mt-2 text-dc-text-2">
          Every company in the system. Read-only for now — creation, impersonation, and audit tooling land in later steps.
        </p>
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
              <code className="shrink-0 font-mono text-xs text-dc-text-3">{t.id}</code>
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
    </main>
  );
}
