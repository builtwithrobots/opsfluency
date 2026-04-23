import { clerkClient } from "@clerk/nextjs/server";
import { ShieldCheck, UserRound } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  changeMemberRole,
  removeMember,
} from "@/app/dashboard/org-settings/_actions/team";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getCompanyContext } from "@/lib/auth/company-context";

interface MemberRow {
  id: string;
  clerk_user_id: string;
  role: string;
  joined_at: string | null;
  invited_at: string | null;
}

interface EnrichedMember extends MemberRow {
  email: string;
  displayName: string | null;
}

async function loadTeam(
  supabase: SupabaseClient,
  company_id: string,
  currentUserId: string,
): Promise<{ members: EnrichedMember[]; currentUserId: string }> {
  const { data, error } = await supabase
    .from("company_members")
    .select("id, clerk_user_id, role, joined_at, invited_at")
    .eq("company_id", company_id)
    .in("role", ["admin", "manager"])
    .order("joined_at", { ascending: true });
  if (error) throw error;

  const rows: MemberRow[] = data ?? [];
  if (!rows.length) return { members: [], currentUserId };

  const clerk = await clerkClient();
  const enriched = await Promise.all(
    rows.map(async (m) => {
      try {
        const user = await clerk.users.getUser(m.clerk_user_id);
        const email = user.emailAddresses[0]?.emailAddress ?? m.clerk_user_id;
        const displayName =
          [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
        return { ...m, email, displayName };
      } catch {
        return { ...m, email: m.clerk_user_id, displayName: null };
      }
    }),
  );

  return { members: enriched, currentUserId };
}

export async function TeamTab() {
  const { supabase, company_id, userId } = await getCompanyContext("admin");
  const { members, currentUserId } = await loadTeam(supabase, company_id, userId);

  return (
    <section className="flex flex-col gap-8 max-w-3xl">
      {/* Member roster */}
      <div>
        <Heading level={2} className="font-display text-xl">
          Admins &amp; managers
        </Heading>
        <Text className="mt-1 text-sm max-w-2xl">
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

              return (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--dc-edge)] bg-dc-raised">
                      {isAdmin ? (
                        <ShieldCheck
                          className="size-4 text-(--color-brand)"
                          strokeWidth={2}
                        />
                      ) : (
                        <UserRound
                          className="size-4 text-dc-text-3"
                          strokeWidth={2}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-dc-text">
                          {m.displayName ?? m.email}
                        </p>
                        {isSelf ? (
                          <span className="rounded border border-(--color-brand)/30 bg-(--color-brand)/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-(--color-brand) uppercase">
                            You
                          </span>
                        ) : null}
                        <span
                          className={
                            isAdmin
                              ? "rounded border border-(--color-brand)/30 bg-(--color-brand)/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-(--color-brand) uppercase"
                              : "rounded border border-[color:var(--dc-edge)] bg-dc-raised px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-dc-text-3 uppercase"
                          }
                        >
                          {isAdmin ? "Admin" : "Manager"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-dc-text-3">
                        {m.displayName ? `${m.email} · ` : ""}
                        {joinedDate}
                      </p>
                    </div>
                  </div>

                  {!isSelf ? (
                    <div className="flex shrink-0 items-center gap-2">
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

      {/* Invite placeholder */}
      <div>
        <Heading level={2} className="font-display text-xl">
          Invite admin or manager
        </Heading>
        <Text className="mt-1 text-sm max-w-2xl">
          To add a new admin or manager, have them sign up at{" "}
          <span className="font-medium text-dc-text">
            {process.env.NEXT_PUBLIC_APP_URL ?? "your app URL"}
          </span>{" "}
          and complete onboarding. Then return here to adjust their role. A
          dedicated invite flow is coming in the next release.
        </Text>
        <div className="mt-4 rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-8 text-center">
          <p className="text-sm font-medium text-dc-text-2">
            Invitation flow coming soon
          </p>
          <p className="mt-1 text-xs text-dc-text-3">
            Email-based invites with role pre-assignment will be available in
            the next sprint.
          </p>
        </div>
      </div>
    </section>
  );
}
