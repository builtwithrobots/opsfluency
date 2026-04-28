import { LogIn, LogOut } from "lucide-react";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getAdminClient } from "@/lib/supabase/admin";

interface ImpersonationEvent {
  id: string;
  super_admin_clerk_user_id: string;
  company_id: string;
  action: "start" | "stop";
  occurred_at: string;
  company_name: string | null;
}

const PAGE_SIZE = 100;

async function loadRecentEvents(): Promise<ImpersonationEvent[]> {
  // impersonation_events is REVOKE'd from anon + authenticated, same
  // pattern as super_admins. Service-role is the only read path.
  const admin = getAdminClient();

  const { data: events, error } = await admin
    .from("impersonation_events")
    .select("id, super_admin_clerk_user_id, company_id, action, occurred_at")
    .order("occurred_at", { ascending: false })
    .limit(PAGE_SIZE);
  if (error) throw error;
  if (!events?.length) return [];

  // Resolve company names in one pass.
  const companyIds = Array.from(new Set(events.map((e) => e.company_id)));
  const { data: companies } = await admin
    .from("companies")
    .select("id, name")
    .in("id", companyIds);

  const nameById = new Map<string, string>();
  for (const c of companies ?? []) nameById.set(c.id, c.name);

  return events.map((e) => ({
    ...e,
    action: e.action as "start" | "stop",
    company_name: nameById.get(e.company_id) ?? null,
  }));
}

export async function ImpersonationTab() {
  const events = await loadRecentEvents();

  return (
    <section className="flex flex-col gap-4">
      <div>
        <Heading level={2} className="text-xl">
          Impersonation audit log
        </Heading>
        <Text className="mt-1 max-w-2xl text-sm">
          Most recent {PAGE_SIZE} start / stop events. Every impersonation
          session writes two rows — one on start, one on stop — so you can
          reconstruct how long any super admin operated as any tenant.
        </Text>
      </div>

      {!events.length ? (
        <div className="rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-10 text-center">
          <p className="text-sm text-dc-text-2">No impersonation events yet.</p>
          <p className="mt-1 text-xs text-dc-text-3">
            Events appear here the moment a super admin uses the
            Impersonate button.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
          <table className="w-full text-sm">
            <thead className="border-b border-[color:var(--dc-edge)] bg-dc-raised/50 text-left text-xs font-medium tracking-[0.08em] text-dc-text-3 uppercase">
              <tr>
                <th className="px-4 py-2.5">When</th>
                <th className="px-4 py-2.5">Action</th>
                <th className="px-4 py-2.5">Super admin</th>
                <th className="px-4 py-2.5">Tenant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--dc-edge)]">
              {events.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2.5 text-dc-text-2 whitespace-nowrap">
                    {new Date(e.occurred_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">
                    {e.action === "start" ? (
                      <span className="inline-flex items-center gap-1.5 text-(--color-signal-live)">
                        <LogIn className="size-3.5" strokeWidth={2} />
                        Start
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-dc-text-3">
                        <LogOut className="size-3.5" strokeWidth={2} />
                        Stop
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <code className="font-mono text-xs text-dc-text-2">
                      {e.super_admin_clerk_user_id}
                    </code>
                  </td>
                  <td className="px-4 py-2.5">
                    {e.company_name ?? (
                      <span className="italic text-dc-text-3">
                        deleted tenant
                      </span>
                    )}
                    <span className="ml-2 font-mono text-xs text-dc-text-3">
                      {e.company_id.slice(0, 8)}…
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
