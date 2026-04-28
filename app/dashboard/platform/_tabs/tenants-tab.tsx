import { Lock, Sparkles, Unlock, Users } from "lucide-react";

import { startImpersonation } from "@/app/dashboard/_actions/impersonation";
import { lockMember, unlockMember } from "@/app/dashboard/platform/_actions/members";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { getSuperAdminContext } from "@/lib/auth/super-admin-context";
import { getAdminClient } from "@/lib/supabase/admin";

interface TenantRow {
  id: string;
  name: string;
  phone: string | null;
  is_demo: boolean;
  created_at: string;
  member_count: number;
}

interface MemberRow {
  id: string;
  clerk_user_id: string;
  role: string;
  locked_at: string | null;
  joined_at: string | null;
}

async function loadTenants(): Promise<TenantRow[]> {
  const { supabase } = await getSuperAdminContext();

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

async function loadMembers(companyId: string): Promise<MemberRow[]> {
  // Service-role client needed: locked_at is a new column and we want to
  // read it even if RLS helpers haven't been updated yet.
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("company_members")
    .select("id, clerk_user_id, role, locked_at, joined_at")
    .eq("company_id", companyId)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MemberRow[];
}

interface TenantsTabProps {
  expandedId?: string;
}

export async function TenantsTab({ expandedId }: TenantsTabProps) {
  const tenants = await loadTenants();

  // Pre-load members for the expanded tenant so we don't nest async calls
  // inside the render loop.
  const expandedMembers =
    expandedId && tenants.some((t) => t.id === expandedId)
      ? await loadMembers(expandedId)
      : null;

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
        Click{" "}
        <strong className="text-dc-text-2">Impersonate</strong>{" "}
        to temporarily operate as that tenant&apos;s admin. Every start and
        stop is recorded in the impersonation log.
      </p>

      <ul className="divide-y divide-[color:var(--dc-edge)] overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
        {tenants.map((t) => (
          <li key={t.id}>
            {/* ── Tenant row ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
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

                {/* Toggle member list */}
                {expandedId === t.id ? (
                  <a
                    href="/dashboard/platform?tab=tenants"
                    className="flex items-center gap-1.5 rounded-md border border-[color:var(--dc-edge)] bg-dc-surface px-3 py-1.5 text-xs font-medium text-dc-text-2 hover:bg-[color:var(--dc-surface-2)]"
                  >
                    <Users className="size-3" />
                    Hide members
                  </a>
                ) : (
                  <a
                    href={`/dashboard/platform?tab=tenants&expand=${t.id}`}
                    className="flex items-center gap-1.5 rounded-md border border-[color:var(--dc-edge)] bg-dc-surface px-3 py-1.5 text-xs font-medium text-dc-text-2 hover:bg-[color:var(--dc-surface-2)]"
                  >
                    <Users className="size-3" />
                    Members
                  </a>
                )}

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
            </div>

            {/* ── Expanded member list ── */}
            {expandedId === t.id && expandedMembers !== null && (
              <div className="border-t border-[color:var(--dc-edge)] bg-[color:var(--dc-surface-2)] px-5 py-3">
                {expandedMembers.length === 0 ? (
                  <p className="py-2 text-sm text-dc-text-3">No members.</p>
                ) : (
                  <ul className="divide-y divide-[color:var(--dc-edge)]">
                    {expandedMembers.map((m) => (
                      <li
                        key={m.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <RoleBadge role={m.role} />
                          <code className="font-mono text-xs text-dc-text-2">
                            {m.clerk_user_id}
                          </code>
                          {m.locked_at && (
                            <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-xs font-medium text-red-400">
                              Locked {new Date(m.locked_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="shrink-0">
                          {m.locked_at ? (
                            <form action={unlockMember}>
                              <input type="hidden" name="member_id" value={m.id} />
                              <input type="hidden" name="company_id" value={t.id} />
                              <button
                                type="submit"
                                className="flex items-center gap-1.5 rounded-md border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400 hover:bg-green-500/20"
                              >
                                <Unlock className="size-3" />
                                Unlock
                              </button>
                            </form>
                          ) : (
                            <form action={lockMember}>
                              <input type="hidden" name="member_id" value={m.id} />
                              <input type="hidden" name="company_id" value={t.id} />
                              <button
                                type="submit"
                                className="flex items-center gap-1.5 rounded-md border border-[color:var(--dc-edge)] bg-dc-surface px-2.5 py-1 text-xs font-medium text-dc-text-3 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                              >
                                <Lock className="size-3" />
                                Lock
                              </button>
                            </form>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin:    "bg-purple-500/10 text-purple-400",
    manager:  "bg-blue-500/10 text-blue-400",
    employee: "bg-[color:var(--dc-edge)] text-dc-text-3",
  };
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs font-medium capitalize ${styles[role] ?? styles.employee}`}
    >
      {role}
    </span>
  );
}
