import { clerkClient } from "@clerk/nextjs/server";
import { UserRound } from "lucide-react";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getCompanyContext } from "@/lib/auth/company-context";
import { formatPhoneDisplay } from "@/lib/employees/phone";
import { InviteFormClient } from "./_components/InviteFormClient";
import { JoinQrClient } from "./_components/JoinQrClient";
import { PendingInvitesList, type InviteRow } from "./_components/PendingInvitesList";

interface EmployeeProfile {
  clerk_user_id: string;
  phone: string | null;
  preferred_language: string;
  last_active_at: string | null;
}

export default async function EmployeesPage() {
  const { supabase, company_id } = await getCompanyContext("manager");

  const [
    companyResult,
    membersResult,
    invitesResult,
    deptsResult,
    deptAssignmentsResult,
    profilesResult,
  ] = await Promise.all([
    supabase.from("companies").select("name").eq("id", company_id).single(),
    supabase
      .from("company_members")
      .select("id, clerk_user_id, joined_at")
      .eq("company_id", company_id)
      .eq("role", "employee")
      .order("joined_at", { ascending: false }),
    supabase
      .from("employee_invites")
      .select("id, phone, name, email_work, email_personal, department_ids, invited_at")
      .eq("company_id", company_id)
      .is("claimed_at", null)
      .order("invited_at", { ascending: false }),
    supabase
      .from("departments")
      .select("id, name")
      .eq("company_id", company_id)
      .order("name"),
    supabase
      .from("employee_departments")
      .select("member_id, department_id")
      .eq("company_id", company_id),
    supabase
      .from("employees")
      .select("clerk_user_id, phone, preferred_language, last_active_at")
      .eq("company_id", company_id),
  ]);

  const companyName = companyResult.data?.name ?? "Your Company";
  const depts = deptsResult.data ?? [];
  const invites = (invitesResult.data ?? []) as InviteRow[];

  const deptMap: Record<string, string> = Object.fromEntries(
    depts.map((d: { id: string; name: string }) => [d.id, d.name]),
  );

  // department names keyed by company_members.id
  const deptsByMemberId = new Map<string, string[]>();
  for (const a of (deptAssignmentsResult.data ?? []) as { member_id: string; department_id: string }[]) {
    if (!deptsByMemberId.has(a.member_id)) deptsByMemberId.set(a.member_id, []);
    const name = deptMap[a.department_id];
    if (name) deptsByMemberId.get(a.member_id)!.push(name);
  }

  const profileByClerkId = new Map<string, EmployeeProfile>(
    (profilesResult.data ?? []).map(
      (p: Record<string, unknown>) => [p.clerk_user_id as string, p as unknown as EmployeeProfile],
    ),
  );

  // Enrich members with Clerk identity
  const clerk = await clerkClient();
  const enriched = await Promise.all(
    ((membersResult.data ?? []) as { id: string; clerk_user_id: string; joined_at: string | null }[]).map(async (m) => {
      try {
        const user = await clerk.users.getUser(m.clerk_user_id);
        return {
          ...m,
          email: user.emailAddresses[0]?.emailAddress ?? "",
          displayName:
            [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
          imageUrl: user.imageUrl ?? null,
        };
      } catch {
        return { ...m, email: m.clerk_user_id, displayName: null, imageUrl: null };
      }
    }),
  );

  const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join/${company_id}`;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.15em] text-(--color-brand) uppercase">
            Manager
          </p>
          <Heading className="font-display mt-2">Employees</Heading>
          <Text className="mt-2 max-w-2xl">
            Invite employees, track who&apos;s joined, and manage department
            assignments.
          </Text>
        </div>
        <InviteFormClient departments={depts} />
      </header>

      {/* Join QR */}
      <section className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-6 shadow-xs">
        <p className="mb-4 text-xs font-semibold tracking-[0.1em] text-dc-text-3 uppercase">
          Employee join QR
        </p>
        <JoinQrClient joinUrl={joinUrl} companyName={companyName} />
      </section>

      {/* Pending invites */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-dc-text">Pending invites</p>
          {invites.length > 0 && (
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              {invites.length}
            </span>
          )}
        </div>
        <PendingInvitesList invites={invites} deptMap={deptMap} />
      </section>

      {/* Active employees */}
      <section className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-dc-text">
          Active employees ({enriched.length})
        </p>

        {enriched.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-12 text-center">
            <UserRound
              className="mb-3 size-8 text-dc-text-3"
              strokeWidth={1.5}
            />
            <p className="text-sm text-dc-text-2">No employees have joined yet.</p>
            <p className="mt-1 text-xs text-dc-text-3">
              Create an invite and post the QR code in your facility.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[color:var(--dc-edge)] overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
            {enriched.map((m: { id: string; clerk_user_id: string; joined_at: string | null; email: string; displayName: string | null; imageUrl: string | null }) => {
              const profile = profileByClerkId.get(m.clerk_user_id);
              const memberDepts = deptsByMemberId.get(m.id) ?? [];
              const joinedDate = m.joined_at
                ? new Date(m.joined_at).toLocaleDateString()
                : null;

              return (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center gap-4 px-5 py-4"
                >
                  {/* Avatar */}
                  {m.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.imageUrl}
                      alt={m.displayName ?? m.email}
                      className="size-9 shrink-0 rounded-full border border-[color:var(--dc-edge)] object-cover"
                    />
                  ) : (
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--dc-edge)] bg-dc-raised text-xs font-semibold text-dc-text-3 uppercase">
                      {(m.displayName ?? m.email).slice(0, 2)}
                    </div>
                  )}

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-dc-text">
                        {m.displayName ?? m.email}
                      </p>
                      <span className="rounded border border-(--color-brand)/30 bg-(--color-brand)/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-(--color-brand) uppercase">
                        Active
                      </span>
                      {profile?.preferred_language === "es" && (
                        <span className="rounded border border-[color:var(--dc-edge)] bg-dc-raised px-1.5 py-0.5 text-[10px] font-medium text-dc-text-3">
                          ES
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 text-xs text-dc-text-3">
                      {m.displayName ? `${m.email} · ` : ""}
                      {profile?.phone
                        ? `${formatPhoneDisplay(profile.phone)} · `
                        : ""}
                      {joinedDate ? `Joined ${joinedDate}` : "Pending"}
                    </p>

                    {memberDepts.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {memberDepts.slice(0, 4).map((name) => (
                          <span
                            key={name}
                            className="rounded border border-[color:var(--dc-edge)] bg-dc-raised px-1.5 py-0.5 text-[10px] text-dc-text-3"
                          >
                            {name}
                          </span>
                        ))}
                        {memberDepts.length > 4 && (
                          <span className="rounded border border-[color:var(--dc-edge)] bg-dc-raised px-1.5 py-0.5 text-[10px] text-dc-text-3">
                            +{memberDepts.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
