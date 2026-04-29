import { FlaskConical } from "lucide-react";

import { openSandbox, resetSandbox } from "@/app/dashboard/platform/_actions/sandbox";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getAdminClient } from "@/lib/supabase/admin";
import { getSuperAdminContext } from "@/lib/auth/super-admin-context";

interface SandboxInfo {
  id: string;
  name: string;
  created_at: string;
  member_count: number;
  qr_count: number;
}

async function loadMySandbox(userId: string): Promise<SandboxInfo | null> {
  const admin = getAdminClient();

  // Find all companies this super admin is a member of, then filter for
  // the sandbox. Two queries avoids a PostgREST cross-filter on a joined
  // table which can silently return all rows in some versions.
  const { data: memberships } = await admin
    .from("company_members")
    .select("company_id")
    .eq("clerk_user_id", userId);

  if (!memberships?.length) return null;

  const companyIds = memberships.map((r: { company_id: string }) => r.company_id);

  const { data: sandboxes } = await admin
    .from("companies")
    .select("id, name, created_at")
    .eq("is_sandbox", true)
    .in("id", companyIds)
    .limit(1);

  if (!sandboxes?.length) return null;

  const sandbox = sandboxes[0];

  const [membersRes, qrsRes] = await Promise.all([
    admin
      .from("company_members")
      .select("*", { count: "exact", head: true })
      .eq("company_id", sandbox.id),
    admin
      .from("qr_codes")
      .select("*", { count: "exact", head: true })
      .eq("company_id", sandbox.id),
  ]);

  return {
    id: sandbox.id,
    name: sandbox.name,
    created_at: sandbox.created_at,
    member_count: membersRes.count ?? 0,
    qr_count: qrsRes.count ?? 0,
  };
}

export async function SandboxTab() {
  const { userId } = await getSuperAdminContext();
  const sandbox = await loadMySandbox(userId);

  return (
    <section className="flex flex-col gap-8">
      <div>
        <Heading level={2} className="text-xl">
          Personal sandbox
        </Heading>
        <Text className="mt-1 max-w-2xl text-sm">
          A dedicated company environment scoped to your super-admin account.
          Use it to test SOPs, QR codes, employee flows, and announcements
          without affecting real tenant data or demo tenants. Data persists
          between sessions until you reset it.
        </Text>
      </div>

      {sandbox ? (
        <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <FlaskConical
                  className="size-4 shrink-0 text-dc-text-3"
                  strokeWidth={1.5}
                />
                <p className="truncate text-base font-medium text-dc-text">
                  {sandbox.name}
                </p>
              </div>
              <p className="mt-1 text-xs text-dc-text-3">
                {sandbox.member_count} member
                {sandbox.member_count === 1 ? "" : "s"} ·{" "}
                {sandbox.qr_count} QR code
                {sandbox.qr_count === 1 ? "" : "s"} · created{" "}
                {new Date(sandbox.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <form action={openSandbox}>
                <button
                  type="submit"
                  className="rounded-md border border-(--color-brand)/30 bg-(--color-brand)/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-(--color-brand) uppercase hover:bg-(--color-brand)/20"
                >
                  Open sandbox
                </button>
              </form>

              <form action={resetSandbox}>
                <input type="hidden" name="company_id" value={sandbox.id} />
                <button
                  type="submit"
                  className="rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-1.5 text-xs font-semibold tracking-wide text-dc-text-2 uppercase hover:text-dc-text"
                >
                  Reset
                </button>
              </form>
            </div>
          </div>

          <div className="border-t border-[color:var(--dc-edge)] px-5 py-3">
            <p className="text-xs text-dc-text-3">
              <strong className="font-medium text-dc-text-2">Reset</strong>{" "}
              wipes all data in this sandbox and recreates it as a fresh empty
              company with default departments. This cannot be undone.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-10 text-center">
          <FlaskConical
            className="mx-auto size-7 text-dc-text-3"
            strokeWidth={1.5}
          />
          <p className="mt-3 text-sm font-medium text-dc-text">
            No sandbox yet
          </p>
          <p className="mt-1 max-w-sm mx-auto text-xs text-dc-text-3">
            Create a personal company environment to test features end-to-end
            without touching real tenants or demo data.
          </p>
          <form action={openSandbox} className="mt-4">
            <button
              type="submit"
              className="rounded-md border border-(--color-brand)/30 bg-(--color-brand)/10 px-4 py-2 text-xs font-semibold tracking-wide text-(--color-brand) uppercase hover:bg-(--color-brand)/20"
            >
              <span className="inline-flex items-center gap-1.5">
                <FlaskConical className="size-3.5" strokeWidth={2} />
                Create &amp; open sandbox
              </span>
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
