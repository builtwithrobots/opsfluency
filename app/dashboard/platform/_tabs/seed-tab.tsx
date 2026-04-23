import { Sparkles } from "lucide-react";

import { startImpersonation } from "@/app/dashboard/_actions/impersonation";
import {
  createDemoTenant,
  deleteDemoTenant,
  refreshDemoTenant,
} from "@/app/dashboard/platform/_actions/seed";
import { Badge } from "@/components/ui/badge";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getSuperAdminContext } from "@/lib/auth/super-admin-context";
import { DEMO_PRESET_LIST } from "@/lib/platform/demo-presets";

interface DemoTenantRow {
  id: string;
  name: string;
  created_at: string;
  member_count: number;
  qr_count: number;
  scan_count: number;
}

async function loadDemoTenants(): Promise<DemoTenantRow[]> {
  const { supabase } = await getSuperAdminContext();

  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, name, created_at")
    .eq("is_demo", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!companies?.length) return [];

  const companyIds = companies.map((c) => c.id);

  const [membersRes, qrsRes, scansRes] = await Promise.all([
    supabase.from("company_members").select("company_id").in("company_id", companyIds),
    supabase.from("qr_codes").select("company_id").in("company_id", companyIds),
    supabase.from("qr_scans").select("company_id").in("company_id", companyIds),
  ]);

  const countBy = (rows: { company_id: string }[] | null | undefined) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) m.set(r.company_id, (m.get(r.company_id) ?? 0) + 1);
    return m;
  };

  const memberCounts = countBy(membersRes.data);
  const qrCounts = countBy(qrsRes.data);
  const scanCounts = countBy(scansRes.data);

  return companies.map((c) => ({
    id: c.id,
    name: c.name,
    created_at: c.created_at,
    member_count: memberCounts.get(c.id) ?? 0,
    qr_count: qrCounts.get(c.id) ?? 0,
    scan_count: scanCounts.get(c.id) ?? 0,
  }));
}

export async function SeedTab() {
  const demoTenants = await loadDemoTenants();

  return (
    <section className="flex flex-col gap-8">
      {/* Presets */}
      <div>
        <Heading level={2} className="font-display text-xl">
          Seed a new demo tenant
        </Heading>
        <Text className="mt-1 max-w-2xl text-sm">
          Each preset creates a company with default departments, a realistic
          set of QR codes, and 30 days of backdated scan history. Safe to run
          multiple times — every run creates a separate tenant flagged
          <code className="mx-1 rounded bg-dc-raised px-1 text-xs">is_demo=true</code>.
        </Text>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {DEMO_PRESET_LIST.map((preset) => (
            <div
              key={preset.id}
              className="flex flex-col gap-3 rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-5 shadow-xs"
            >
              <div>
                <p className="text-xs font-medium tracking-[0.12em] text-(--color-brand) uppercase">
                  Preset
                </p>
                <h3 className="mt-1 text-base font-semibold text-dc-text">
                  {preset.displayName}
                </h3>
              </div>
              <Text className="text-sm">{preset.description}</Text>
              <ul className="flex flex-wrap gap-1.5 pt-1 text-xs text-dc-text-3">
                <li className="rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-2 py-0.5">
                  {preset.qrCodes.length} QR codes
                </li>
                <li className="rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-2 py-0.5">
                  ~{preset.qrCodes.length * preset.scansPerCode} scans / 30d
                </li>
              </ul>
              <form action={createDemoTenant} className="pt-2">
                <input type="hidden" name="preset" value={preset.id} />
                <button
                  type="submit"
                  className="w-full rounded-md border border-(--color-brand)/30 bg-(--color-brand)/10 px-3 py-2 text-xs font-semibold tracking-wide text-(--color-brand) uppercase hover:bg-(--color-brand)/20"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="size-3.5" strokeWidth={2} />
                    Create demo tenant
                  </span>
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>

      {/* Existing demo tenants */}
      <div>
        <Heading level={2} className="font-display text-xl">
          Existing demo tenants
        </Heading>
        <Text className="mt-1 max-w-2xl text-sm">
          Demo tenants only. Delete / refresh actions here cannot touch real
          customer data — the SQL function rejects any row where
          <code className="mx-1 rounded bg-dc-raised px-1 text-xs">is_demo=false</code>.
        </Text>

        {!demoTenants.length ? (
          <div className="mt-4 rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-10 text-center">
            <p className="text-sm text-dc-text-2">No demo tenants yet.</p>
            <p className="mt-1 text-xs text-dc-text-3">
              Pick a preset above to spin one up.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-[color:var(--dc-edge)] overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
            {demoTenants.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-base font-medium text-dc-text">{t.name}</p>
                    <Badge color="brand">
                      <Sparkles className="size-3" strokeWidth={2} />
                      Demo
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-dc-text-3">
                    {t.member_count} member{t.member_count === 1 ? "" : "s"} ·
                    {" "}{t.qr_count} QR codes ·
                    {" "}{t.scan_count} scans ·
                    {" "}created {new Date(t.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <form action={startImpersonation}>
                    <input type="hidden" name="company_id" value={t.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-(--color-brand)/30 bg-(--color-brand)/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-(--color-brand) uppercase hover:bg-(--color-brand)/20"
                    >
                      Impersonate
                    </button>
                  </form>
                  <form action={refreshDemoTenant} className="flex items-center gap-1.5">
                    <input type="hidden" name="company_id" value={t.id} />
                    {/* Refresh lets the super admin pick which preset to
                        re-seed against — names get disconnected from the
                        original preset once a demo tenant exists, and
                        "refresh to a different shape" is a legitimate use. */}
                    <select
                      name="preset"
                      defaultValue={DEMO_PRESET_LIST[0].id}
                      aria-label="Preset to refresh with"
                      className="rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-2 py-1.5 text-xs text-dc-text-2"
                    >
                      {DEMO_PRESET_LIST.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.id}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-1.5 text-xs font-semibold tracking-wide text-dc-text-2 uppercase hover:text-dc-text"
                    >
                      Refresh
                    </button>
                  </form>
                  <form action={deleteDemoTenant}>
                    <input type="hidden" name="company_id" value={t.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-(--color-signal-urgent)/30 bg-(--color-signal-urgent)/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-(--color-signal-urgent) uppercase hover:bg-(--color-signal-urgent)/20"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
