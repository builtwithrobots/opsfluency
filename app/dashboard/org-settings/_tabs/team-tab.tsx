import { clerkClient } from "@clerk/nextjs/server";
import { AlertTriangle, Crown, Info, ShieldCheck, UserRound, Users } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  changeMemberRole,
  removeMember,
} from "@/app/dashboard/org-settings/_actions/team";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getCompanyContext } from "@/lib/auth/company-context";

import { AssignDepartmentsModal } from "../_components/AssignDepartmentsModal";
import { PendingTeamInvitesList } from "../_components/PendingTeamInvitesList";
import { TeamBulkUploadClient } from "../_components/TeamBulkUploadClient";
import { TeamInviteFormClient } from "../_components/TeamInviteFormClient";

interface MemberRow {
  id: string;
  clerk_user_id: string;
  role: string;
  is_owner: boolean;
  joined_at: string | null;
  invited_at: string | null;
}

interface EnrichedMember extends MemberRow {
  email: string;
  displayName: string | null;
}

interface Dept {
  id: string;
  name: string;
}

interface PendingInvite {
  id: string;
  token: string;
  email: string;
  name: string | null;
  role: string;
  invited_at: string;
  department_ids: string[];
}

async function loadTeam(
  supabase: SupabaseClient,
  company_id: string,
  currentUserId: string,
): Promise<{
  members: EnrichedMember[];
  pendingInvites: PendingInvite[];
  departments: Dept[];
  memberDepts: Record<string, string[]>;
  currentUserId: string;
}> {
  const [{ data: rows, error }, { data: invites }, { data: depts }] =
    await Promise.all([
      supabase
        .from("company_members")
        .select("id, clerk_user_id, role, is_owner, joined_at, invited_at")
        .eq("company_id", company_id)
        .in("role", ["admin", "manager"])
        .order("joined_at", { ascending: true }),
      supabase
        .from("team_invites")
        .select("id, token, email, name, role, invited_at, department_ids")
        .eq("company_id", company_id)
        .is("claimed_at", null)
        .order("invited_at", { ascending: false }),
      supabase
        .from("departments")
        .select("id, name")
        .eq("company_id", company_id)
        .order("name", { ascending: true }),
    ]);
  if (error) throw error;

  const memberRows: MemberRow[] = (rows ?? []).map((r) => ({
    ...r,
    is_owner: Boolean(r.is_owner),
  }));

  // Fetch department assignments for all active members in one query
  const memberIds = memberRows.map((m) => m.id);
  const { data: deptAssignments } = memberIds.length > 0
    ? await supabase
        .from("employee_departments")
        .select("member_id, department_id")
        .eq("company_id", company_id)
        .in("member_id", memberIds)
    : { data: [] };

  const memberDepts: Record<string, string[]> = {};
  for (const row of deptAssignments ?? []) {
    if (!memberDepts[row.member_id]) memberDepts[row.member_id] = [];
    memberDepts[row.member_id].push(row.department_id);
  }

  const clerk = await clerkClient();
  const enriched = await Promise.all(
    memberRows.map(async (m) => {
      try {
        const user = await clerk.users.getUser(m.clerk_user_id);
        const email =
          user.emailAddresses[0]?.emailAddress ?? m.clerk_user_id;
        const displayName =
          [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
        return { ...m, email, displayName };
      } catch {
        return { ...m, email: m.clerk_user_id, displayName: null };
      }
    }),
  );

  return {
    members: enriched,
    pendingInvites: (invites ?? []) as PendingInvite[],
    departments: (depts ?? []) as Dept[],
    memberDepts,
    currentUserId,
  };
}

export async function TeamTab() {
  const { supabase, company_id, userId } = await getCompanyContext("admin");
  const { members, pendingInvites, departments, memberDepts, currentUserId } =
    await loadTeam(supabase, company_id, userId);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <section className="flex max-w-3xl flex-col gap-8">
      {/* ── Role reference card ── */}
      <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface">
        <div className="flex items-center gap-2 border-b border-[color:var(--dc-edge)] px-4 py-3">
          <Info className="size-4 shrink-0 text-dc-text-3" strokeWidth={2} />
          <span className="text-sm font-semibold text-dc-text">Roles in your org</span>
        </div>
        <div className="divide-y divide-[color:var(--dc-edge)]">
          <div className="flex items-start gap-3 px-4 py-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-(--color-brand)" strokeWidth={2} />
            <div>
              <p className="text-sm font-medium text-dc-text">Admin</p>
              <p className="mt-0.5 text-xs text-dc-text-3">Full org access — billing, settings, all departments, all managers. Can invite and remove other admins and managers.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 px-4 py-3">
            <UserRound className="mt-0.5 size-4 shrink-0 text-dc-text-3" strokeWidth={2} />
            <div>
              <p className="text-sm font-medium text-dc-text">Manager</p>
              <p className="mt-0.5 text-xs text-dc-text-3">Scoped to their assigned departments — can manage SOPs, employees, announcements, and monitors within those departments.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 px-4 py-3">
            <Users className="mt-0.5 size-4 shrink-0 text-dc-text-3" strokeWidth={2} />
            <div>
              <p className="text-sm font-medium text-dc-text">Employee</p>
              <p className="mt-0.5 text-xs text-dc-text-3">Can view SOPs, scan QR codes, read announcements, and use HR chat. Managed from the <span className="font-medium text-dc-text">Employees</span> tab, not here.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Active members ── */}
      <div>
        <Heading level={2} className="text-xl">
          Admins &amp; managers
        </Heading>
        <Text className="mt-1 max-w-2xl text-sm">
          Admins have full org access including billing and settings. Managers
          can manage SOPs, employees, announcements, and monitors scoped to
          their departments.
        </Text>

        {!members.length ? (
          <div className="mt-4 rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-10 text-center">
            <p className="text-sm text-dc-text-2">No admins or managers found.</p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-[color:var(--dc-edge)] overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
            {members.map((m) => {
              const isSelf = m.clerk_user_id === currentUserId;
              const isAdmin = m.role === "admin";
              const nextRole = isAdmin ? "manager" : "admin";
              const nextRoleLabel = isAdmin ? "Make manager" : "Make admin";
              const joinedDate = m.joined_at
                ? new Date(m.joined_at).toLocaleDateString()
                : m.invited_at
                  ? `Invited ${new Date(m.invited_at).toLocaleDateString()}`
                  : "Unknown";

              const assignedDeptIds = memberDepts[m.id] ?? [];
              const assignedDepts = departments.filter((d) =>
                assignedDeptIds.includes(d.id),
              );
              const noDepts = !isAdmin && assignedDepts.length === 0;

              return (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--dc-edge)] bg-dc-raised">
                      {isAdmin ? (
                        <ShieldCheck className="size-4 text-(--color-brand)" strokeWidth={2} />
                      ) : (
                        <UserRound className="size-4 text-violet-500" strokeWidth={2} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-dc-text">
                          {m.displayName ?? m.email}
                        </p>

                        {/* ORG OWNER badge */}
                        {m.is_owner && (
                          <span className="flex items-center gap-1 rounded border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-600 dark:text-amber-400 uppercase">
                            <Crown className="size-2.5" strokeWidth={2} />
                            Org owner
                          </span>
                        )}

                        <span
                          className={
                            isAdmin
                              ? "rounded border border-(--color-brand)/30 bg-(--color-brand)/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-(--color-brand) uppercase"
                              : "rounded border border-violet-400/30 bg-violet-400/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-violet-600 dark:text-violet-400 uppercase"
                          }
                        >
                          {isAdmin ? "Admin" : "Manager"}
                        </span>
                      </div>

                      <p className="mt-0.5 text-xs text-dc-text-3">
                        {m.displayName ? `${m.email} · ` : ""}
                        {joinedDate}
                      </p>

                      {/* Department chips (managers only) */}
                      {!isAdmin && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {noDepts ? (
                            <span className="flex items-center gap-1 rounded border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="size-2.5" strokeWidth={2} />
                              No dept assigned
                            </span>
                          ) : (
                            assignedDepts.map((d) => (
                              <span
                                key={d.id}
                                className="rounded border border-[color:var(--dc-edge)] bg-dc-raised px-1.5 py-0.5 text-[10px] text-dc-text-3"
                              >
                                {d.name}
                              </span>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions — locked for self and org owner */}
                  {!isSelf && !m.is_owner ? (
                    <div className="flex shrink-0 items-center gap-2">
                      {/* Department assignment for managers */}
                      {!isAdmin && (
                        <AssignDepartmentsModal
                          memberId={m.id}
                          memberName={m.displayName ?? m.email}
                          currentDepartmentIds={assignedDeptIds}
                          allDepartments={departments}
                        />
                      )}
                      <form action={changeMemberRole}>
                        <input type="hidden" name="member_id" value={m.id} />
                        <input type="hidden" name="new_role" value={nextRole} />
                        <button
                          type="submit"
                          className="rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-1.5 text-xs font-medium text-dc-text-2 hover:bg-dc-overlay hover:text-dc-text"
                        >
                          {nextRoleLabel}
                        </button>
                      </form>
                      <form action={removeMember}>
                        <input type="hidden" name="member_id" value={m.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-(--color-signal-urgent)/30 bg-(--color-signal-urgent)/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-(--color-signal-urgent) uppercase hover:bg-(--color-signal-urgent)/20"
                        >
                          Remove
                        </button>
                      </form>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Pending invites ── */}
      {pendingInvites.length > 0 && (
        <div>
          <Heading level={2} className="text-xl">
            Pending invites
          </Heading>
          <Text className="mt-1 max-w-2xl text-sm">
            These invites haven&apos;t been claimed yet. Copy the link to
            resend, or revoke a link with the trash icon.
          </Text>
          <div className="mt-4">
            <PendingTeamInvitesList
              invites={pendingInvites}
              departments={departments}
              appUrl={appUrl}
            />
          </div>
        </div>
      )}

      {/* ── Invite section ── */}
      <div>
        <Heading level={2} className="text-xl">
          Invite admin or manager
        </Heading>
        <Text className="mt-1 max-w-2xl text-sm">
          Enter a work email and role to generate a secure invite link. Share
          the link with the recipient — they sign in (or create an account)
          and the role is assigned automatically. Use bulk upload for multiple
          invites at once.
        </Text>
        <div className="mt-4 flex flex-wrap gap-3">
          <TeamInviteFormClient departments={departments} />
          <TeamBulkUploadClient departments={departments} />
        </div>
      </div>
    </section>
  );
}
