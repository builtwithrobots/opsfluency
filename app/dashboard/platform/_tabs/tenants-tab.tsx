import { Sparkles } from "lucide-react";

import { startImpersonation } from "@/app/dashboard/_actions/impersonation";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { getSuperAdminContext } from "@/lib/auth/super-admin-context";

interface TenantRow {
  id: string;
  name: string;
  phone: string | null;
  is_demo: boolean;
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
    .select("id, name, phone, is_demo, created_at")
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
    is_demo: Boolean(c.is_demo),
    created_at: c.created_at,
    member_count: counts.get(c.id) ?? 0,
  }));
}

export async function TenantsTab() {
  const tenants = await loadTenants();

  if (!tenants.length) {
    return (
      <div className="rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-16 text-center">
        <p className="text-dc-text-2">No tenants yet.</p>
        <Text className="mt-1 text-sm">
          The first company shows up here after a user completes onboarding,
          or after you seed one from the Seed / demo tab.
        </Text>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <p className="text-sm text-dc-text-3">
        Click <strong className="text-dc-text-2">Impersonate</strong> to
        temporarily operate as that tenant&apos;s admin. Every start and stop
        is recorded in the impersonation log.
      </p>

      <ul className="divide-y divide-[color:var(--dc-edge)] overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
        {tenants.map((t) => (
          <li
            key={t.id}
            className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-base font-medium text-dc-text">
                  {t.name}
                </p>
                {t.is_demo ? (
                  <Badge color="brand">
                    <Sparkles className="size-3" strokeWidth={2} />
                    Demo
                  </Badge>
                ) : null}
              </div>
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
    </section>
  );
}
