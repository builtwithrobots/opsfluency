import { clerkClient } from "@clerk/nextjs/server";
import { UserRoundPlus, UserRoundX, UsersRound } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  assignMemberToDepartment,
  removeMemberFromDepartment,
} from "@/app/dashboard/departments/_actions/members";
import {
  DEPT_COLORS,
  DEPT_ICONS,
} from "@/app/dashboard/departments/_lib/constants";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getCompanyContext } from "@/lib/auth/company-context";

interface Props {
  selectedDeptId?: string;
}

interface DeptRow {
  id: string;
  name: string;
  color_key: string;
  icon_key: string;
}

interface MemberRow {
  id: string;
  clerk_user_id: string;
  role: string;
}

interface EnrichedMember extends MemberRow {
  email: string;
  displayName: string | null;
  imageUrl: string | null;
}

async function loadDepts(
  supabase: SupabaseClient,
  company_id: string,
): Promise<DeptRow[]> {
  const { data, error } = await supabase
    .from("departments")
    .select("id, name, color_key, icon_key")
    .eq("company_id", company_id)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function loadMembersPanel(
  supabase: SupabaseClient,
  company_id: string,
  department_id: string,
): Promise<{ assigned: EnrichedMember[]; unassigned: EnrichedMember[] }> {
  const [{ data: allMembers }, { data: memberships }] = await Promise.all([
    supabase
      .from("company_members")
      .select("id, clerk_user_id, role")
      .eq("company_id", company_id)
      .order("role", { ascending: true }),
    supabase
      .from("employee_departments")
      .select("member_id")
      .eq("department_id", department_id)
      .eq("company_id", company_id),
  ]);

  const assignedIds = new Set((memberships ?? []).map((m) => m.member_id));
  const rows: MemberRow[] = allMembers ?? [];

  const clerk = await clerkClient();
  const enriched = await Promise.all(
    rows.map(async (m): Promise<EnrichedMember> => {
      try {
        const user = await clerk.users.getUser(m.clerk_user_id);
        const email = user.emailAddresses[0]?.emailAddress ?? m.clerk_user_id;
        const displayName =
          [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
        const imageUrl = user.imageUrl ?? null;
        return { ...m, email, displayName, imageUrl };
      } catch {
        return { ...m, email: m.clerk_user_id, displayName: null, imageUrl: null };
      }
    }),
  );

  return {
    assigned: enriched.filter((m) => assignedIds.has(m.id)),
    unassigned: enriched.filter((m) => !assignedIds.has(m.id)),
  };
}

export async function MembersTab({ selectedDeptId }: Props) {
  const { supabase, company_id } = await getCompanyContext("manager");
  const depts = await loadDepts(supabase, company_id);

  const selectedDept = selectedDeptId
    ? depts.find((d) => d.id === selectedDeptId) ?? null
    : null;

  const panel =
    selectedDept
      ? await loadMembersPanel(supabase, company_id, selectedDept.id)
      : null;

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      {/* ── Left panel: department list ──────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs self-start">
        <div className="border-b border-[color:var(--dc-edge)] px-4 py-3">
          <p className="text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase">
            Departments
          </p>
        </div>

        {!depts.length ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-dc-text-2">No departments yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[color:var(--dc-edge)]">
            {depts.map((dept) => {
              const colorKey =
                dept.color_key in DEPT_COLORS
                  ? (dept.color_key as keyof typeof DEPT_COLORS)
                  : "zinc";
              const iconKey = dept.icon_key in DEPT_ICONS ? dept.icon_key : "building-2";
              const { bg } = DEPT_COLORS[colorKey];
              const { Icon } = DEPT_ICONS[iconKey];
              const isActive = dept.id === selectedDeptId;

              return (
                <li key={dept.id}>
                  <a
                    href={`/dashboard/departments?tab=members&dept=${dept.id}`}
                    className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-dc-overlay ${
                      isActive ? "bg-dc-overlay font-medium text-dc-text" : "text-dc-text-2"
                    }`}
                  >
                    <div
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full ${bg}`}
                    >
                      <Icon className="size-3.5 text-white" strokeWidth={2} />
                    </div>
                    <span className="truncate">{dept.name}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Right panel: roster ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        {!selectedDept ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-16 text-center">
            <UsersRound className="size-8 text-dc-text-3 mb-3" strokeWidth={1.5} />
            <p className="text-sm font-medium text-dc-text-2">
              Select a department to manage its members
            </p>
            <p className="mt-1 text-xs text-dc-text-3">
              Click any department on the left to view and assign members.
            </p>
          </div>
        ) : (
          <>
            {/* Roster heading */}
            <div>
              <Heading level={2} className="font-display text-xl">
                {selectedDept.name}
              </Heading>
              <Text className="mt-1 text-sm">
                {panel!.assigned.length} member
                {panel!.assigned.length !== 1 ? "s" : ""} assigned
              </Text>
            </div>

            {/* Assigned members */}
            <div className="overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
              <div className="border-b border-[color:var(--dc-edge)] px-5 py-3">
                <p className="text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase">
                  Assigned members
                </p>
              </div>

              {!panel!.assigned.length ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-dc-text-2">No members assigned yet.</p>
                  <p className="mt-1 text-xs text-dc-text-3">
                    Use the form below to add members to this department.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-[color:var(--dc-edge)]">
                  {panel!.assigned.map((member) => (
                    <li
                      key={member.id}
                      className="flex flex-wrap items-center justify-between gap-4 px-5 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {member.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={member.imageUrl}
                            alt={member.displayName ?? member.email}
                            className="size-8 shrink-0 rounded-full border border-[color:var(--dc-edge)] object-cover"
                          />
                        ) : (
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--dc-edge)] bg-dc-raised text-xs font-semibold text-dc-text-3 uppercase">
                            {(member.displayName ?? member.email).slice(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-dc-text">
                            {member.displayName ?? member.email}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-dc-text-3">
                            {member.displayName ? `${member.email} · ` : ""}
                            <span className="capitalize">{member.role}</span>
                          </p>
                        </div>
                      </div>

                      <form action={removeMemberFromDepartment}>
                        <input type="hidden" name="department_id" value={selectedDept.id} />
                        <input type="hidden" name="member_id" value={member.id} />
                        <button
                          type="submit"
                          className="flex items-center gap-1.5 rounded-md border border-(--color-signal-urgent)/30 bg-(--color-signal-urgent)/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-(--color-signal-urgent) uppercase hover:bg-(--color-signal-urgent)/20"
                        >
                          <UserRoundX className="size-3" strokeWidth={2} />
                          Remove
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Add member */}
            {panel!.unassigned.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
                <div className="border-b border-[color:var(--dc-edge)] px-5 py-3">
                  <p className="text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase">
                    Add member
                  </p>
                </div>
                <form
                  action={assignMemberToDepartment}
                  className="flex flex-wrap items-end gap-3 px-5 py-4"
                >
                  <input type="hidden" name="department_id" value={selectedDept.id} />
                  <label className="flex flex-1 flex-col gap-1.5 min-w-[180px]">
                    <span className="text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase">
                      Select member
                    </span>
                    <select
                      name="member_id"
                      required
                      className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none"
                    >
                      <option value="">Choose a member…</option>
                      {panel!.unassigned.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.displayName
                            ? `${member.displayName} — ${member.email}`
                            : member.email}{" "}
                          ({member.role})
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="submit"
                    className="flex shrink-0 items-center gap-1.5 rounded-md border border-(--color-brand)/30 bg-(--color-brand)/10 px-4 py-2 text-xs font-semibold tracking-wide text-(--color-brand) uppercase hover:bg-(--color-brand)/20"
                  >
                    <UserRoundPlus className="size-3.5" strokeWidth={2} />
                    Assign
                  </button>
                </form>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-5 py-4 text-center">
                <p className="text-sm text-dc-text-2">
                  All company members are already assigned to this department.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
