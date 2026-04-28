import { ShieldCheck } from "lucide-react";

import {
  addSuperAdmin,
  removeSuperAdmin,
} from "@/app/dashboard/platform/_actions/admins";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getSuperAdminContext } from "@/lib/auth/super-admin-context";
import { getAdminClient } from "@/lib/supabase/admin";

interface SuperAdminRow {
  id: string;
  clerk_user_id: string;
  note: string | null;
  created_at: string;
}

async function loadSuperAdmins(): Promise<SuperAdminRow[]> {
  // super_admins is REVOKE'd from anon + authenticated, so even the
  // super-admin JWT client can't SELECT it. Service-role is the only
  // path to the data. Calling context is already gated by the Platform
  // layout + the page's own getSuperAdminContext call.
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("super_admins")
    .select("id, clerk_user_id, note, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function AdminsTab() {
  const { userId: currentUserId } = await getSuperAdminContext();
  const admins = await loadSuperAdmins();

  return (
    <section className="flex flex-col gap-8">
      {/* Existing roster */}
      <div>
        <Heading level={2} className="text-xl">
          Super admin roster
        </Heading>
        <Text className="mt-1 max-w-2xl text-sm">
          Users in this list see every tenant&apos;s data and can impersonate
          any company. Membership is a hardcoded allowlist — there is no
          signup flow. Grant only to owner-level staff.
        </Text>

        {!admins.length ? (
          <div className="mt-4 rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-10 text-center">
            <p className="text-sm text-dc-text-2">No super admins configured.</p>
            <p className="mt-1 text-xs text-dc-text-3">
              You shouldn&apos;t be seeing this screen if that&apos;s true —
              the Platform layout requires super-admin access.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-[color:var(--dc-edge)] overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
            {admins.map((a) => {
              const isSelf = a.clerk_user_id === currentUserId;
              return (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-(--color-brand)" strokeWidth={2} />
                      <code className="font-mono text-sm text-dc-text">
                        {a.clerk_user_id}
                      </code>
                      {isSelf ? (
                        <span className="rounded border border-(--color-brand)/30 bg-(--color-brand)/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-(--color-brand) uppercase">
                          You
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-dc-text-3">
                      {a.note ?? <span className="italic">no note</span>}
                      {" · "}
                      added {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <form action={removeSuperAdmin}>
                    <input type="hidden" name="clerk_user_id" value={a.clerk_user_id} />
                    <button
                      type="submit"
                      disabled={isSelf}
                      aria-disabled={isSelf}
                      title={isSelf ? "You can't remove yourself" : undefined}
                      className="rounded-md border border-(--color-signal-urgent)/30 bg-(--color-signal-urgent)/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-(--color-signal-urgent) uppercase hover:bg-(--color-signal-urgent)/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-(--color-signal-urgent)/10"
                    >
                      Remove
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Add new */}
      <div>
        <Heading level={2} className="text-xl">
          Grant super admin
        </Heading>
        <Text className="mt-1 max-w-2xl text-sm">
          Paste the target user&apos;s Clerk id (e.g.
          <code className="mx-1 rounded bg-dc-raised px-1 text-xs">user_2abcDEF...</code>)
          and optionally a note. The user needs an existing Clerk account; this
          does not create one.
        </Text>

        <form
          action={addSuperAdmin}
          className="mt-4 flex flex-col gap-3 rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-5 shadow-xs md:flex-row md:items-end"
        >
          <label className="flex-1">
            <span className="block text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase">
              Clerk user id
            </span>
            <input
              name="clerk_user_id"
              type="text"
              required
              placeholder="user_..."
              className="mt-1 w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 font-mono text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
            />
          </label>
          <label className="flex-1">
            <span className="block text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase">
              Note (optional)
            </span>
            <input
              name="note"
              type="text"
              placeholder="e.g. Founder — onboarded 2026-04-22"
              className="mt-1 w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="shrink-0 rounded-md border border-(--color-brand)/30 bg-(--color-brand)/10 px-4 py-2 text-xs font-semibold tracking-wide text-(--color-brand) uppercase hover:bg-(--color-brand)/20"
          >
            Grant
          </button>
        </form>
      </div>
    </section>
  );
}
