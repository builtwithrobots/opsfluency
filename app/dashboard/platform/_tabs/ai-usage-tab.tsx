import { Cpu, DollarSign, Timer } from "lucide-react";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getAdminClient } from "@/lib/supabase/admin";

const ROLLUP_DAYS = 30;

// Rough public pricing as of 2026-Q1. These are best-effort estimates
// for the platform dashboard, not billing-grade. When Anthropic updates
// prices, update this table; surfacing it as a constant keeps the
// source visible in code review instead of hiding inside a calc.
//
// $ per 1M tokens (input, output).
const PRICE_PER_MTOK: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5":  { input: 0.8, output: 4 },
  // Fallback for any unrecognized model — use Sonnet pricing as a
  // conservative upper-bound estimate so unknown models never look
  // cheaper than they are.
  default:              { input: 3, output: 15 },
};

interface AiCallRow {
  model: string;
  input_tokens: number;
  output_tokens: number;
  duration_ms: number;
  company_id: string | null;
  created_at: string;
}

interface ModelRollup {
  model: string;
  calls: number;
  input_tokens: number;
  output_tokens: number;
  avg_duration_ms: number;
  estimated_cost: number;
}

interface TenantRollup {
  company_id: string;
  company_name: string | null;
  calls: number;
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number;
}

interface UsageData {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalEstimatedCost: number;
  avgDurationMs: number;
  byModel: ModelRollup[];
  topTenants: TenantRollup[];
}

function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const price = PRICE_PER_MTOK[model] ?? PRICE_PER_MTOK.default;
  return (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
}

async function loadUsage(): Promise<UsageData> {
  // ai_call_log is REVOKE'd from anon + authenticated. Service-role
  // only. Window is a rolling 30 days — long enough to smooth out
  // spiky days, short enough to stay a single-query read.
  const admin = getAdminClient();

  const since = new Date(Date.now() - ROLLUP_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: calls, error } = await admin
    .from("ai_call_log")
    .select("model, input_tokens, output_tokens, duration_ms, company_id, created_at")
    .gte("created_at", since);
  if (error) throw error;

  const rows: AiCallRow[] = calls ?? [];

  const totalCalls = rows.length;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalDurationMs = 0;
  let totalEstimatedCost = 0;

  const modelMap = new Map<string, ModelRollup>();
  const tenantMap = new Map<string, TenantRollup>();

  for (const r of rows) {
    totalInputTokens += r.input_tokens;
    totalOutputTokens += r.output_tokens;
    totalDurationMs += r.duration_ms;
    const cost = estimateCost(r.model, r.input_tokens, r.output_tokens);
    totalEstimatedCost += cost;

    // By model
    const mKey = r.model;
    const m = modelMap.get(mKey) ?? {
      model: mKey,
      calls: 0,
      input_tokens: 0,
      output_tokens: 0,
      avg_duration_ms: 0,
      estimated_cost: 0,
    };
    m.calls += 1;
    m.input_tokens += r.input_tokens;
    m.output_tokens += r.output_tokens;
    m.avg_duration_ms += r.duration_ms;
    m.estimated_cost += cost;
    modelMap.set(mKey, m);

    // By tenant (skip null company_id rows — those are non-tenant-scoped calls)
    if (r.company_id) {
      const tKey = r.company_id;
      const t = tenantMap.get(tKey) ?? {
        company_id: tKey,
        company_name: null,
        calls: 0,
        input_tokens: 0,
        output_tokens: 0,
        estimated_cost: 0,
      };
      t.calls += 1;
      t.input_tokens += r.input_tokens;
      t.output_tokens += r.output_tokens;
      t.estimated_cost += cost;
      tenantMap.set(tKey, t);
    }
  }

  // Finalize per-model average duration.
  for (const m of modelMap.values()) {
    m.avg_duration_ms = m.calls ? m.avg_duration_ms / m.calls : 0;
  }

  const byModel = Array.from(modelMap.values()).sort(
    (a, b) => b.estimated_cost - a.estimated_cost,
  );

  // Top 5 tenants by cost. Resolve names in one pass.
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
    totalInputTokens,
    totalOutputTokens,
    totalEstimatedCost,
    avgDurationMs: totalCalls ? totalDurationMs / totalCalls : 0,
    byModel,
    topTenants: topTenantRollups,
  };
}

function fmtTokens(n: number): string {
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

export async function AiUsageTab() {
  const data = await loadUsage();

  return (
    <section className="flex flex-col gap-6">
      <div>
        <Heading level={2} className="font-display text-xl">
          AI usage — last {ROLLUP_DAYS} days
        </Heading>
        <Text className="mt-1 max-w-2xl text-sm">
          Rolled up from <code className="rounded bg-dc-raised px-1 text-xs">ai_call_log</code>.
          Cost estimates are based on public per-token pricing and are
          best-effort — always reconcile against the Anthropic billing
          portal for anything finance-grade.
        </Text>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SimpleStat label="Calls" value={data.totalCalls.toLocaleString()} icon={<Cpu className="size-5" strokeWidth={2} />} />
        <SimpleStat label="Input tokens" value={fmtTokens(data.totalInputTokens)} icon={<Cpu className="size-5" strokeWidth={2} />} />
        <SimpleStat label="Output tokens" value={fmtTokens(data.totalOutputTokens)} icon={<Cpu className="size-5" strokeWidth={2} />} />
        <SimpleStat label="Est. cost" value={fmtUsd(data.totalEstimatedCost)} icon={<DollarSign className="size-5" strokeWidth={2} />} />
      </div>

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
                  <tr key={m.model}>
                    <td className="px-4 py-2.5 font-mono text-xs text-dc-text">{m.model}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-dc-text-2">{m.calls.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-dc-text-2">{fmtTokens(m.input_tokens)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-dc-text-2">{fmtTokens(m.output_tokens)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-dc-text-2">
                      <span className="inline-flex items-center gap-1">
                        <Timer className="size-3 text-dc-text-3" strokeWidth={2} />
                        {fmtMs(m.avg_duration_ms)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-dc-text">{fmtUsd(m.estimated_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top tenants */}
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
                  <th className="px-4 py-2.5 text-right">Tokens</th>
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
                      <span className="ml-2 font-mono text-xs text-dc-text-3">{t.company_id.slice(0, 8)}…</span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-dc-text-2">{t.calls.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-dc-text-2">
                      {fmtTokens(t.input_tokens + t.output_tokens)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-dc-text">{fmtUsd(t.estimated_cost)}</td>
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

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-8 text-center text-sm text-dc-text-3">
      {children}
    </div>
  );
}
