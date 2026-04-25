import { Cpu, DollarSign, Languages, Timer } from "lucide-react";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getAdminClient } from "@/lib/supabase/admin";

const ROLLUP_DAYS = 30;

type UnitKind = "token" | "character";

// Rough public pricing as of 2026-Q1. These are best-effort estimates
// for the platform dashboard, not billing-grade. When Anthropic or
// Google updates prices, update this table; surfacing it as a constant
// keeps the source visible in code review instead of hiding inside a
// calc.
//
// $ per 1M units. The unit is `unit_kind`-dependent: tokens for
// Anthropic, source characters for Google. Google bills source only,
// so its `output` rate is 0.
const PRICE_PER_M_UNITS: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-6":   { input: 3,    output: 15 },
  "claude-haiku-4-5":    { input: 0.8,  output: 4 },
  "google-translate-v2": { input: 20,   output: 0 },
  // Fallback for any unrecognized model — use Sonnet pricing as a
  // conservative upper-bound estimate so unknown models never look
  // cheaper than they are.
  default:                { input: 3,    output: 15 },
};

interface AiCallRow {
  model: string;
  input_units: number;
  output_units: number;
  unit_kind: UnitKind;
  duration_ms: number;
  company_id: string | null;
  created_at: string;
}

interface ModelRollup {
  model: string;
  unit_kind: UnitKind;
  calls: number;
  input_units: number;
  output_units: number;
  avg_duration_ms: number;
  estimated_cost: number;
}

interface TenantRollup {
  company_id: string;
  company_name: string | null;
  calls: number;
  estimated_cost: number;
}

interface UsageData {
  totalCalls: number;
  totalEstimatedCost: number;
  avgDurationMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalInputChars: number;
  totalOutputChars: number;
  byModel: ModelRollup[];
  topTenants: TenantRollup[];
}

function estimateCost(
  model: string,
  inputUnits: number,
  outputUnits: number,
): number {
  const price = PRICE_PER_M_UNITS[model] ?? PRICE_PER_M_UNITS.default;
  return (inputUnits * price.input + outputUnits * price.output) / 1_000_000;
}

async function loadUsage(): Promise<UsageData> {
  // ai_call_log is REVOKE'd from anon + authenticated. Service-role
  // only. Window is a rolling 30 days — long enough to smooth out
  // spiky days, short enough to stay a single-query read.
  const admin = getAdminClient();

  const since = new Date(Date.now() - ROLLUP_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: calls, error } = await admin
    .from("ai_call_log")
    .select("model, input_units, output_units, unit_kind, duration_ms, company_id, created_at")
    .gte("created_at", since);
  if (error) throw error;

  const rows: AiCallRow[] = calls ?? [];

  const totalCalls = rows.length;
  let totalDurationMs = 0;
  let totalEstimatedCost = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalInputChars = 0;
  let totalOutputChars = 0;

  // Per-model rollup keyed by (model, unit_kind) — a future model that
  // billed both wouldn't merge into a single row. Today every model
  // has exactly one unit_kind, but the key shape stays correct.
  const modelMap = new Map<string, ModelRollup>();
  const tenantMap = new Map<string, TenantRollup>();

  for (const r of rows) {
    totalDurationMs += r.duration_ms;
    const cost = estimateCost(r.model, r.input_units, r.output_units);
    totalEstimatedCost += cost;

    if (r.unit_kind === "token") {
      totalInputTokens += r.input_units;
      totalOutputTokens += r.output_units;
    } else {
      totalInputChars += r.input_units;
      totalOutputChars += r.output_units;
    }

    const mKey = `${r.model}::${r.unit_kind}`;
    const m = modelMap.get(mKey) ?? {
      model: r.model,
      unit_kind: r.unit_kind,
      calls: 0,
      input_units: 0,
      output_units: 0,
      avg_duration_ms: 0,
      estimated_cost: 0,
    };
    m.calls += 1;
    m.input_units += r.input_units;
    m.output_units += r.output_units;
    m.avg_duration_ms += r.duration_ms;
    m.estimated_cost += cost;
    modelMap.set(mKey, m);

    if (r.company_id) {
      const tKey = r.company_id;
      const t = tenantMap.get(tKey) ?? {
        company_id: tKey,
        company_name: null,
        calls: 0,
        estimated_cost: 0,
      };
      t.calls += 1;
      t.estimated_cost += cost;
      tenantMap.set(tKey, t);
    }
  }

  for (const m of modelMap.values()) {
    m.avg_duration_ms = m.calls ? m.avg_duration_ms / m.calls : 0;
  }

  const byModel = Array.from(modelMap.values()).sort(
    (a, b) => b.estimated_cost - a.estimated_cost,
  );

  const topTenantRollups = Array.from(tenantMap.values())
    .sort((a, b) => b.estimated_cost - a.estimated_cost)
    .slice(0, 5);

  if (topTenantRollups.length) {
    const { data: companies } = await admin
      .from("companies")
      .select("id, name")
      .in("id", topTenantRollups.map((t) => t.company_id));
    const nameById = new Map<string, string>();
    for (const c of companies ?? []) nameById.set(c.id, c.name);
    for (const t of topTenantRollups) t.company_name = nameById.get(t.company_id) ?? null;
  }

  return {
    totalCalls,
    totalEstimatedCost,
    avgDurationMs: totalCalls ? totalDurationMs / totalCalls : 0,
    totalInputTokens,
    totalOutputTokens,
    totalInputChars,
    totalOutputChars,
    byModel,
    topTenants: topTenantRollups,
  };
}

function fmtUnits(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function fmtUsd(n: number): string {
  return `$${n.toFixed(n < 1 ? 4 : 2)}`;
}

function fmtMs(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}s`;
  return `${Math.round(n)}ms`;
}

function unitKindLabel(kind: UnitKind, count: number): string {
  if (kind === "token") return count === 1 ? "token" : "tokens";
  return count === 1 ? "character" : "characters";
}

export async function AiUsageTab() {
  const data = await loadUsage();

  const hasTokens = data.totalInputTokens + data.totalOutputTokens > 0;
  const hasChars = data.totalInputChars + data.totalOutputChars > 0;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <Heading level={2} className="font-display text-xl">
          AI usage — last {ROLLUP_DAYS} days
        </Heading>
        <Text className="mt-1 max-w-2xl text-sm">
          Rolled up from <code className="rounded bg-dc-raised px-1 text-xs">ai_call_log</code>{" "}
          across every provider — Anthropic Sonnet for SOP conversion (billed per
          token) and Google Cloud Translation for English → Spanish (billed per
          source character). Cost estimates are best-effort against published
          pricing — always reconcile against each provider&apos;s billing portal
          for anything finance-grade.
        </Text>
      </div>

      {/* Headline stats — cost is the universal currency, so it leads. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SimpleStat
          label="Calls"
          value={data.totalCalls.toLocaleString()}
          icon={<Cpu className="size-5" strokeWidth={2} />}
        />
        <SimpleStat
          label="Avg duration"
          value={fmtMs(data.avgDurationMs)}
          icon={<Timer className="size-5" strokeWidth={2} />}
        />
        <SimpleStat
          label="Est. cost"
          value={fmtUsd(data.totalEstimatedCost)}
          icon={<DollarSign className="size-5" strokeWidth={2} />}
        />
      </div>

      {/* Per-unit breakdown — split, since tokens and characters don't compose. */}
      {(hasTokens || hasChars) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {hasTokens && (
            <UnitBreakdown
              title="Tokens"
              icon={<Cpu className="size-4" strokeWidth={2} />}
              input={data.totalInputTokens}
              output={data.totalOutputTokens}
            />
          )}
          {hasChars && (
            <UnitBreakdown
              title="Characters"
              icon={<Languages className="size-4" strokeWidth={2} />}
              input={data.totalInputChars}
              output={data.totalOutputChars}
            />
          )}
        </div>
      )}

      {/* By model */}
      <div>
        <Heading level={3} className="font-display text-base">By model</Heading>
        {!data.byModel.length ? (
          <EmptyRow>No AI calls recorded in the last {ROLLUP_DAYS} days.</EmptyRow>
        ) : (
          <div className="mt-2 overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
            <table className="w-full text-sm">
              <thead className="border-b border-[color:var(--dc-edge)] bg-dc-raised/50 text-left text-xs font-medium tracking-[0.08em] text-dc-text-3 uppercase">
                <tr>
                  <th className="px-4 py-2.5">Model</th>
                  <th className="px-4 py-2.5 text-right">Calls</th>
                  <th className="px-4 py-2.5 text-right">Input</th>
                  <th className="px-4 py-2.5 text-right">Output</th>
                  <th className="px-4 py-2.5 text-right">Avg duration</th>
                  <th className="px-4 py-2.5 text-right">Est. cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--dc-edge)]">
                {data.byModel.map((m) => (
                  <tr key={`${m.model}::${m.unit_kind}`}>
                    <td className="px-4 py-2.5">
                      <div className="font-mono text-xs text-dc-text">{m.model}</div>
                      <div className="mt-0.5 text-[10px] tracking-wider text-dc-text-3 uppercase">
                        per {m.unit_kind}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-dc-text-2">
                      {m.calls.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-dc-text-2">
                      <span title={`${m.input_units.toLocaleString()} ${unitKindLabel(m.unit_kind, m.input_units)}`}>
                        {fmtUnits(m.input_units)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-dc-text-2">
                      <span title={`${m.output_units.toLocaleString()} ${unitKindLabel(m.unit_kind, m.output_units)}`}>
                        {fmtUnits(m.output_units)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-dc-text-2">
                      <span className="inline-flex items-center gap-1">
                        <Timer className="size-3 text-dc-text-3" strokeWidth={2} />
                        {fmtMs(m.avg_duration_ms)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-dc-text">
                      {fmtUsd(m.estimated_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top tenants — cost-only, since tokens and chars don't sum meaningfully. */}
      <div>
        <Heading level={3} className="font-display text-base">Top tenants by spend</Heading>
        {!data.topTenants.length ? (
          <EmptyRow>No tenant-attributed calls recorded.</EmptyRow>
        ) : (
          <div className="mt-2 overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
            <table className="w-full text-sm">
              <thead className="border-b border-[color:var(--dc-edge)] bg-dc-raised/50 text-left text-xs font-medium tracking-[0.08em] text-dc-text-3 uppercase">
                <tr>
                  <th className="px-4 py-2.5">Tenant</th>
                  <th className="px-4 py-2.5 text-right">Calls</th>
                  <th className="px-4 py-2.5 text-right">Est. cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--dc-edge)]">
                {data.topTenants.map((t) => (
                  <tr key={t.company_id}>
                    <td className="px-4 py-2.5">
                      {t.company_name ?? (
                        <span className="italic text-dc-text-3">deleted tenant</span>
                      )}
                      <span className="ml-2 font-mono text-xs text-dc-text-3">
                        {t.company_id.slice(0, 8)}…
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-dc-text-2">
                      {t.calls.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-dc-text">
                      {fmtUsd(t.estimated_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function SimpleStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-4 shadow-xs">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase">{label}</p>
          <p className="font-display mt-2 text-2xl font-semibold text-dc-text tabular-nums">{value}</p>
        </div>
        <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-(--color-brand)/10 text-(--color-brand)">
          {icon}
        </span>
      </div>
    </div>
  );
}

function UnitBreakdown({
  title,
  icon,
  input,
  output,
}: {
  title: string;
  icon: React.ReactNode;
  input: number;
  output: number;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-4 shadow-xs">
      <div className="flex items-center gap-2 text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase">
        <span aria-hidden className="text-dc-text-3">{icon}</span>
        {title}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] tracking-wider text-dc-text-3 uppercase">Input</p>
          <p className="mt-1 text-lg font-semibold text-dc-text tabular-nums">{fmtUnits(input)}</p>
        </div>
        <div>
          <p className="text-[10px] tracking-wider text-dc-text-3 uppercase">Output</p>
          <p className="mt-1 text-lg font-semibold text-dc-text tabular-nums">{fmtUnits(output)}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-8 text-center text-sm text-dc-text-3">
      {children}
    </div>
  );
}
