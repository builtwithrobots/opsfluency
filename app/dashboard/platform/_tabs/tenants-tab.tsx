import { Clock, Lock, Sparkles, Unlock, Users } from "lucide-react";

import { startImpersonation } from "@/app/dashboard/_actions/impersonation";
import { lockMember, unlockMember } from "@/app/dashboard/platform/_actions/members";
import { reactivateTenant } from "@/app/dashboard/platform/_actions/deactivate-tenant";
import { MemberDeleteButton } from "@/app/dashboard/platform/_tabs/member-delete-button";
import { TenantDeactivateDialog } from "@/app/dashboard/platform/_tabs/tenant-deactivate-dialog";
import { TenantDeleteDialog } from "@/app/dashboard/platform/_tabs/tenant-delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { getSuperAdminContext } from "@/lib/auth/super-admin-context";
import { getAdminClient } from "@/lib/supabase/admin";

export type ShowFilter = "active" | "inactive" | "all";

interface TenantRow {
  id: string;
  name: string;
  phone: string | null;
  is_demo: boolean;
  deactivated_at: string | null;
  created_at: string;
  member_count: number;
  last_activity_at: string | null;
}

interface MemberRow {
  id: string;
  clerk_user_id: string;
  role: string;
  locked_at: string | null;
  joined_at: string | null;
}

async function loadTenants(show: ShowFilter): Promise<TenantRow[]> {
  const { supabase } = await getSuperAdminContext();

  let query = supabase
    .from("companies")
    .select("id, name, phone, is_demo, deactivated_at, created_at")
    .order("created_at", { ascending: false });

  if (show === "active") query = query.is("deactivated_at", null);
  if (show === "inactive") query = query.not("deactivated_at", "is", null);

  const { data: rawCompanies, error } = await query;
  if (error) throw error;
  if (!rawCompanies) return [];
  const companies = rawCompanies as Array<{
    id: string;
    name: string;
    phone: string | null;
    is_demo: boolean;
    deactivated_at: string | null;
    created_at: string;
  }>;

  const { data: members, error: memberError } = await supabase
    .from("company_members")
    .select("company_id");
  if (memberError) throw memberError;

  // Most recent QR scan per company — used as the "last activity" signal.
  const { data: recentScans } = await supabase
    .from("qr_scans")
    .select("company_id, scanned_at")
    .in("company_id", companies.map((c) => c.id))
    .order("scanned_at", { ascending: false });

  const counts = new Map<string, number>();
  for (const m of members ?? []) {
    counts.set(m.company_id, (counts.get(m.company_id) ?? 0) + 1);
  }

  // Keep only the most recent scan timestamp per company.
  const lastScan = new Map<string, string>();
  for (const s of recentScans ?? []) {
    if (!lastScan.has(s.company_id)) {
      lastScan.set(s.company_id, s.scanned_at);
    }
  }

  return companies.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    is_demo: Boolean(c.is_demo),
    deactivated_at: c.deactivated_at ?? null,
    created_at: c.created_at,
    member_count: counts.get(c.id) ?? 0,
    last_activity_at: lastScan.get(c.id) ?? null,
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

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}

interface TenantsTabProps {
  expandedId?: string;
  show?: ShowFilter;
}

export async function TenantsTab({ expandedId, show = "active" }: TenantsTabProps) {
  const tenants = await loadTenants(show);

  // Pre-load members for the expanded tenant so we don't nest async calls
  // inside the render loop.
  const expandedMembers =
    expandedId && tenants.some((t) => t.id === expandedId)
      ? await loadMembers(expandedId)
      : null;

  const filterLinks: { label: string; value: ShowFilter }[] = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "All", value: "all" },
  ];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-dc-text-3">
          Click{" "}
          <strong className="text-dc-text-2">Impersonate</strong>{" "}
          to temporarily operate as that tenant&apos;s admin. Use{" "}
          <strong className="text-dc-text-2">Deactivate</strong>{" "}
          to suspend access while preserving all data — including AI token history.
          Deactivated tenants can be reactivated at any time.{" "}
          <strong className="text-dc-text-2">Delete</strong>{" "}
          permanently wipes a tenant and cannot be undone.
        </p>

        {/* Filter toggle */}
        <div className="flex shrink-0 overflow-hidden rounded-lg border border-[color:var(--dc-edge)] text-xs font-medium">
          {filterLinks.map(({ label, value }) => (
            <a
              key={value}
              href={`/dashboard/platform?tab=tenants&show=${value}`}
              className={
                show === value
                  ? "bg-(--color-brand)/15 px-3 py-1.5 text-(--color-brand)"
                  : "px-3 py-1.5 text-dc-text-2 hover:bg-[color:var(--dc-surface-2)]"
              }
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      {!tenants.length ? (
        <div className="rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-16 text-center">
          <p className="text-dc-text-2">
            {show === "inactive" ? "No inactive tenants." : "No tenants yet."}
          </p>
          <Text className="mt-1 text-sm">
            {show === "inactive"
              ? "Deactivated companies will appear here."
              : "The first company shows up here after a user completes onboarding, or after you seed one from the Seed / demo tab."}
          </Text>
        </div>
      ) : (
        <ul className="divide-y divide-[color:var(--dc-edge)] overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
          {tenants.map((t) => {
            const isInactive = Boolean(t.deactivated_at);
            return (
              <li key={t.id} className={isInactive ? "opacity-60" : undefined}>
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
                      {isInactive ? (
                        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-400">
                          Inactive since {new Date(t.deactivated_at!).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-dc-text-2">
                      <span>
                        {t.member_count} member{t.member_count === 1 ? "" : "s"}
                      </span>
                      <span aria-hidden className="text-dc-text-3">·</span>
                      <span>{t.phone ?? "no phone"}</span>
                      <span aria-hidden className="text-dc-text-3">·</span>
                      <span>created {new Date(t.created_at).toLocaleDateString()}</span>
                      <span aria-hidden className="text-dc-text-3">·</span>
                      {t.last_activity_at ? (
                        <span className="inline-flex items-center gap-1 text-dc-text-2">
                          <Clock className="size-3 text-dc-text-3" strokeWidth={2} />
                          active {formatRelativeTime(t.last_activity_at)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-dc-text-3">
                          <Clock className="size-3" strokeWidth={2} />
                          no activity
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
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
                        href={`/dashboard/platform?tab=tenants&show=${show}&expand=${t.id}`}
                        className="flex items-center gap-1.5 rounded-md border border-[color:var(--dc-edge)] bg-dc-surface px-3 py-1.5 text-xs font-medium text-dc-text-2 hover:bg-[color:var(--dc-surface-2)]"
                      >
                        <Users className="size-3" />
                        Members
                      </a>
                    )}

                    {!isInactive && (
                      <form action={startImpersonation}>
                        <input type="hidden" name="company_id" value={t.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-(--color-brand)/30 bg-(--color-brand)/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-(--color-brand) uppercase hover:bg-(--color-brand)/20"
                        >
                          Impersonate
                        </button>
                      </form>
                    )}

                    {isInactive ? (
                      <form action={reactivateTenant}>
                        <input type="hidden" name="company_id" value={t.id} />
                        <button
                          type="submit"
                          className="flex items-center gap-1.5 rounded-md border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 transition-colors"
                        >
                          Reactivate
                        </button>
                      </form>
                    ) : (
                      <TenantDeactivateDialog companyId={t.id} companyName={t.name} />
                    )}

                    <TenantDeleteDialog companyId={t.id} companyName={t.name} />
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
                              {m.joined_at && (
                                <span className="text-xs text-dc-text-3">
                                  joined {new Date(m.joined_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
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

                              <MemberDeleteButton
                                memberId={m.id}
                                companyId={t.id}
                                clerkUserId={m.clerk_user_id}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
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
