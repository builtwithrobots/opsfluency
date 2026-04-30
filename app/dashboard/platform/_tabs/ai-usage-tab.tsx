import { Cpu, DollarSign, Languages, Timer } from "lucide-react";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  type PlanTier,
  TIER_CONFIG,
  TIER_BADGE_CLASSES,
  aiCostThreshold,
  impliedMargin,
} from "@/lib/types/billing";

import { TenantDeleteButton } from "./tenant-delete-button";
import { TenantPlanSelect } from "./tenant-plan-select";

type UnitKind = "token" | "character";

const PRESET_DAYS = [7, 30, 90] as const;
type PresetDays = (typeof PRESET_DAYS)[number];

function isPresetDays(n: number): n is PresetDays {
  return PRESET_DAYS.includes(n as PresetDays);
}

// Rough public pricing as of 2026-Q1. Best-effort for the platform
// dashboard — always reconcile against each provider's billing portal.
//
// $ per 1M units. Unit is `unit_kind`-dependent: tokens for Anthropic,
// source characters for Google. Google bills source only (output rate 0).
interface ModelPrice {
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
}

const PRICE_PER_M_UNITS: Record<string, ModelPrice> = {
  "claude-sonnet-4-6":        { input: 3,    output: 15,   cacheWrite: 3.75, cacheRead: 0.30 },
  "claude-haiku-4-5-20251001":{ input: 1.00, output: 5,    cacheWrite: 1.25, cacheRead: 0.10 },
  "claude-haiku-4-5":         { input: 1.00, output: 5,    cacheWrite: 1.25, cacheRead: 0.10 },
  "google-translate-v2":      { input: 20,   output: 0,    cacheWrite: 0,    cacheRead: 0    },
  // Conservative upper-bound fallback so unknown models never look cheaper.
  default:                    { input: 3,    output: 15,   cacheWrite: 3.75, cacheRead: 0.30 },
};

interface AiCallRow {
  model: string;
  input_units: number;
  output_units: number;
  cache_write_tokens: number;
  cache_read_tokens: number;
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
  plan_tier: PlanTier;
  calls: number;
  anthropic_cost: number;
  google_cost: number;
  total_cost: number;
  input_tokens: number;
  output_tokens: number;
  input_chars: number;
  output_chars: number;
  projected_monthly: number; // total_cost extrapolated to 30 days
  prior_total_cost: number;  // spend in the equivalent prior window
  trend_pct: number | null;  // (current - prior) / prior; null if no prior data
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

function estimateCost(row: AiCallRow): number {
  const price = PRICE_PER_M_UNITS[row.model] ?? PRICE_PER_M_UNITS.default;
  // For token-based rows, split input into regular / cache-write / cache-read
  // buckets because each is billed at a different rate. Cache-read tokens are
  // 10× cheaper than regular input — ignoring them overstates Sonnet spend.
  // Character-based rows (Google) have 0 in both cache columns so the formula
  // degrades correctly to: input_units * price.input.
  const regularInput = row.input_units - row.cache_write_tokens - row.cache_read_tokens;
  return (
    regularInput           * price.input      +
    row.cache_write_tokens * price.cacheWrite  +
    row.cache_read_tokens  * price.cacheRead   +
    row.output_units       * price.output
  ) / 1_000_000;
}

async function loadUsage(days: number): Promise<UsageData> {
  // ai_call_log is REVOKE'd from anon + authenticated. Service-role only.
  const admin = getAdminClient();

  const now = Date.now();
  const since = new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
  const priorSince = new Date(now - 2 * days * 24 * 60 * 60 * 1000).toISOString();

  // Fetch current period and prior period in parallel.
  const [{ data: calls, error }, { data: priorCalls }] = await Promise.all([
    admin
      .from("ai_call_log")
      .select("model, input_units, output_units, cache_write_tokens, cache_read_tokens, unit_kind, duration_ms, company_id, created_at")
      .gte("created_at", since),
    admin
      .from("ai_call_log")
      .select("model, input_units, output_units, cache_write_tokens, cache_read_tokens, unit_kind, company_id")
      .gte("created_at", priorSince)
      .lt("created_at", since),
  ]);
  if (error) throw error;

  // Build prior-period cost per tenant for trend calculation.
  const priorCostByCompany = new Map<string, number>();
  for (const r of priorCalls ?? []) {
    if (!r.company_id) continue;
    const cost = estimateCost(r as AiCallRow);
    priorCostByCompany.set(r.company_id, (priorCostByCompany.get(r.company_id) ?? 0) + cost);
  }

  const rows: AiCallRow[] = calls ?? [];

  const totalCalls = rows.length;
  let totalDurationMs = 0;
  let totalEstimatedCost = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalInputChars = 0;
  let totalOutputChars = 0;

  const modelMap = new Map<string, ModelRollup>();
  const tenantMap = new Map<string, TenantRollup>();

  for (const r of rows) {
    totalDurationMs += r.duration_ms;
    const cost = estimateCost(r);
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
      const t = tenantMap.get(r.company_id) ?? {
        company_id: r.company_id,
        company_name: null,
        plan_tier: "starter" as PlanTier, // replaced after company lookup
        calls: 0,
        anthropic_cost: 0,
        google_cost: 0,
        total_cost: 0,
        input_tokens: 0,
        output_tokens: 0,
        input_chars: 0,
        output_chars: 0,
        projected_monthly: 0,
        prior_total_cost: 0,
        trend_pct: null,
      };
      t.calls += 1;
      if (r.unit_kind === "token") {
        t.anthropic_cost += cost;
        t.input_tokens += r.input_units;
        t.output_tokens += r.output_units;
      } else {
        t.google_cost += cost;
        t.input_chars += r.input_units;
        t.output_chars += r.output_units;
      }
      t.total_cost += cost;
      tenantMap.set(r.company_id, t);
    }
  }

  for (const m of modelMap.values()) {
    m.avg_duration_ms = m.calls ? m.avg_duration_ms / m.calls : 0;
  }

  const byModel = Array.from(modelMap.values()).sort(
    (a, b) => b.estimated_cost - a.estimated_cost,
  );

  const topTenantRollups = Array.from(tenantMap.values())
    .sort((a, b) => b.total_cost - a.total_cost)
    .slice(0, 5);

  if (topTenantRollups.length) {
    const { data: companies } = await admin
      .from("companies")
      .select("id, name, plan_tier")
      .in("id", topTenantRollups.map((t) => t.company_id));
    const nameById = new Map<string, string>();
    const tierById = new Map<string, PlanTier>();
    for (const c of companies ?? []) {
      nameById.set(c.id, c.name);
      // plan_tier may be absent on older DB snapshots before migration is applied.
      tierById.set(c.id, ((c as { plan_tier?: string }).plan_tier as PlanTier | undefined) ?? "starter");
    }
    for (const t of topTenantRollups) {
      t.company_name    = nameById.get(t.company_id) ?? null;
      t.plan_tier       = tierById.get(t.company_id) ?? "starter";
      t.prior_total_cost = priorCostByCompany.get(t.company_id) ?? 0;
      t.projected_monthly = (t.total_cost / days) * 30;
      t.trend_pct = t.prior_total_cost > 0
        ? (t.total_cost - t.prior_total_cost) / t.prior_total_cost
        : null;
    }
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

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AiUsageTabProps {
  days?: number;
}

export async function AiUsageTab({ days: rawDays = 30 }: AiUsageTabProps) {
  const days = isPresetDays(rawDays) ? rawDays : 30;
  const data = await loadUsage(days);

  const hasTokens = data.totalInputTokens + data.totalOutputTokens > 0;
  const hasChars = data.totalInputChars + data.totalOutputChars > 0;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Heading level={2} className="text-xl">
            AI usage
          </Heading>
          <Text className="mt-1 max-w-2xl text-sm">
            Rolled up from{" "}
            <code className="rounded bg-dc-raised px-1 text-xs">ai_call_log</code>{" "}
            across every provider — Anthropic Haiku/Sonnet for SOP conversion (billed
            per token) and Google Cloud Translation for English → Spanish (billed per
            source character). Cost estimates are best-effort against published
            pricing — always reconcile against each provider&apos;s billing portal
            for anything finance-grade.
          </Text>
        </div>

        {/* Date range presets */}
        <nav className="flex shrink-0 items-center gap-1 rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised p-1">
          {PRESET_DAYS.map((d) => (
            <a
              key={d}
              href={`/dashboard/platform?tab=ai&days=${d}`}
              className={[
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                d === days
                  ? "bg-dc-surface text-dc-text shadow-xs"
                  : "text-dc-text-3 hover:text-dc-text-2",
              ].join(" ")}
            >
              {d}d
            </a>
          ))}
        </nav>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SimpleStat
          label="Calls"
          value={data.totalCalls.toLocaleString()}
          sub={`last ${days} days`}
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

      {/* Per-unit breakdown */}
      {(hasTokens || hasChars) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <UnitBreakdown
            title="Tokens"
            subtitle="Anthropic — SOP conversion"
            icon={<Cpu className="size-4" strokeWidth={2} />}
            input={data.totalInputTokens}
            output={data.totalOutputTokens}
            empty={!hasTokens}
          />
          <UnitBreakdown
            title="Characters"
            subtitle="Google — translation"
            icon={<Languages className="size-4" strokeWidth={2} />}
            input={data.totalInputChars}
            output={data.totalOutputChars}
            empty={!hasChars}
          />
        </div>
      )}

      {/* By model */}
      <div>
        <Heading level={3} className="text-base">By model</Heading>
        {!data.byModel.length ? (
          <EmptyRow>No AI calls recorded in the last {days} days.</EmptyRow>
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

      {/* Top tenants */}
      <div>
        <Heading level={3} className="text-base">Top tenants by spend</Heading>
        {!data.topTenants.length ? (
          <EmptyRow>No tenant-attributed calls recorded.</EmptyRow>
        ) : (
          <>
            <div className="mt-2 overflow-x-auto rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
              <table className="w-full text-sm">
                <thead className="border-b border-[color:var(--dc-edge)] bg-dc-raised/50 text-left text-xs font-medium tracking-[0.08em] text-dc-text-3 uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Tenant</th>
                    <th className="px-4 py-2.5 text-right">Calls</th>
                    <th className="px-4 py-2.5 text-right">Anthropic</th>
                    <th className="px-4 py-2.5 text-right">Google</th>
                    <th className="px-4 py-2.5 text-right">Proj.&nbsp;/&nbsp;Month</th>
                    <th className="px-4 py-2.5">vs Cap</th>
                    <th className="px-4 py-2.5 text-right">Margin</th>
                    <th className="px-4 py-2.5 text-right">Plan</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--dc-edge)]">
                  {data.topTenants.map((t) => {
                    const threshold = aiCostThreshold(t.plan_tier);
                    const capPct = threshold !== null ? Math.min(t.projected_monthly / threshold, 1) : null;
                    const margin = impliedMargin(t.plan_tier, t.projected_monthly);
                    const marginPct = margin !== null ? Math.round(margin * 100) : null;
                    const capBarColor =
                      capPct === null ? ""
                      : capPct >= 0.8 ? "bg-red-500"
                      : capPct >= 0.5 ? "bg-amber-500"
                      : "bg-emerald-500";
                    const marginColor =
                      marginPct === null ? "text-dc-text-3"
                      : marginPct >= 90 ? "text-emerald-400"
                      : marginPct >= 80 ? "text-amber-400"
                      : "text-red-400";

                    return (
                      <tr key={t.company_id}>
                        {/* Tenant */}
                        <td className="px-4 py-3">
                          <div>
                            {t.company_name ? (
                              <span className="font-medium text-dc-text">{t.company_name}</span>
                            ) : (
                              <span className="italic text-dc-text-3">deleted tenant</span>
                            )}
                            <span className="ml-2 font-mono text-xs text-dc-text-3">
                              {t.company_id.slice(0, 8)}…
                            </span>
                          </div>
                          <span
                            className={[
                              "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                              TIER_BADGE_CLASSES[t.plan_tier],
                            ].join(" ")}
                          >
                            {TIER_CONFIG[t.plan_tier].label}
                          </span>
                        </td>

                        {/* Calls */}
                        <td className="px-4 py-3 text-right tabular-nums text-dc-text-2">
                          {t.calls.toLocaleString()}
                        </td>

                        {/* Anthropic */}
                        <td className="px-4 py-3 text-right tabular-nums">
                          {t.anthropic_cost > 0 ? (
                            <div>
                              <div className="font-medium text-dc-text-2">{fmtUsd(t.anthropic_cost)}</div>
                              <div className="mt-0.5 text-[10px] text-dc-text-3">
                                {fmtUnits(t.input_tokens)} in · {fmtUnits(t.output_tokens)} out
                              </div>
                            </div>
                          ) : (
                            <span className="text-dc-text-3">—</span>
                          )}
                        </td>

                        {/* Google */}
                        <td className="px-4 py-3 text-right tabular-nums">
                          {t.google_cost > 0 ? (
                            <div>
                              <div className="font-medium text-dc-text-2">{fmtUsd(t.google_cost)}</div>
                              <div className="mt-0.5 text-[10px] text-dc-text-3">
                                {fmtUnits(t.input_chars)} in · {fmtUnits(t.output_chars)} out
                              </div>
                            </div>
                          ) : (
                            <span className="text-dc-text-3">—</span>
                          )}
                        </td>

                        {/* Proj. / Month */}
                        <td className="px-4 py-3 text-right tabular-nums">
                          <div className="font-semibold text-dc-text">{fmtUsd(t.projected_monthly)}</div>
                          <div className="mt-0.5 text-[10px] text-dc-text-3">
                            {days}d actual: {fmtUsd(t.total_cost)}
                          </div>
                          {t.trend_pct !== null && (
                            <div
                              className={[
                                "mt-0.5 text-[10px] tabular-nums",
                                t.trend_pct > 0.05 ? "text-red-400"
                                : t.trend_pct < -0.05 ? "text-emerald-400"
                                : "text-dc-text-3",
                              ].join(" ")}
                            >
                              {t.trend_pct > 0 ? "▲" : "▼"}{" "}
                              {Math.abs(Math.round(t.trend_pct * 100))}% vs prior {days}d
                            </div>
                          )}
                        </td>

                        {/* vs Cap */}
                        <td className="px-4 py-3 min-w-[140px]">
                          {capPct !== null && threshold !== null ? (
                            <div>
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-dc-overlay">
                                <div
                                  className={["h-full rounded-full transition-all", capBarColor].join(" ")}
                                  style={{ width: `${capPct * 100}%` }}
                                />
                              </div>
                              <div className="mt-1 text-[10px] tabular-nums text-dc-text-3">
                                {fmtUsd(t.projected_monthly)} of {fmtUsd(threshold)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-dc-text-3">—</span>
                          )}
                        </td>

                        {/* Margin */}
                        <td className="px-4 py-3 text-right">
                          {marginPct !== null ? (
                            <span className={["font-semibold tabular-nums", marginColor].join(" ")}>
                              {marginPct}%
                            </span>
                          ) : (
                            <span className="text-xs text-dc-text-3">—</span>
                          )}
                        </td>

                        {/* Plan selector */}
                        <td className="px-4 py-3 text-right">
                          <TenantPlanSelect
                            companyId={t.company_id}
                            currentTier={t.plan_tier}
                          />
                        </td>

                        {/* Delete */}
                        <td className="px-4 py-3 text-right">
                          <TenantDeleteButton companyId={t.company_id} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <p className="mt-2 text-[11px] text-dc-text-3">
              <strong className="text-dc-text-2">Cap</strong> = AI spend concern threshold (20% of monthly plan price).{" "}
              <strong className="text-dc-text-2">Margin</strong> = est. gross margin after AI + Stripe 3% + Vercel + Supabase fixed COGS.{" "}
              <strong className="text-dc-text-2">Proj.&nbsp;/&nbsp;Month</strong> = {days}d spend extrapolated to 30 days.
              Trend compares to the prior {days}-day window.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SimpleStat({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-4 shadow-xs">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-dc-text tabular-nums">{value}</p>
          {sub && <p className="mt-0.5 text-[11px] text-dc-text-3">{sub}</p>}
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
  subtitle,
  icon,
  input,
  output,
  empty,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  input: number;
  output: number;
  empty?: boolean;
}) {
  const valueClass = empty
    ? "mt-1 text-lg font-semibold text-dc-text-3 tabular-nums"
    : "mt-1 text-lg font-semibold text-dc-text tabular-nums";
  return (
    <div className="rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-4 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase">
            <span aria-hidden className="text-dc-text-3">{icon}</span>
            {title}
          </div>
          {subtitle && (
            <p className="mt-0.5 truncate text-[11px] text-dc-text-3">{subtitle}</p>
          )}
        </div>
        {empty && (
          <span className="rounded-full bg-dc-overlay px-2 py-0.5 text-[10px] font-medium tracking-wider text-dc-text-3 uppercase">
            No data yet
          </span>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] tracking-wider text-dc-text-3 uppercase">Input</p>
          <p className={valueClass}>{empty ? "—" : fmtUnits(input)}</p>
        </div>
        <div>
          <p className="text-[10px] tracking-wider text-dc-text-3 uppercase">Output</p>
          <p className={valueClass}>{empty ? "—" : fmtUnits(output)}</p>
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
