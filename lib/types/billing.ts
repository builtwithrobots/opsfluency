// Subscription tier definitions and cost helpers.
// Source of truth: docs/pricing.md (PRD.md tiers, monthly annual pricing).

export type PlanTier = "starter" | "growth" | "scale" | "enterprise";

interface TierConfig {
  label: string;
  monthlyPrice: number | null; // null = custom / enterprise
  employeeCap: number | null;
}

export const TIER_CONFIG: Record<PlanTier, TierConfig> = {
  starter:    { label: "Starter",    monthlyPrice: 79,   employeeCap: 50   },
  growth:     { label: "Growth",     monthlyPrice: 119,  employeeCap: 150  },
  scale:      { label: "Scale",      monthlyPrice: 199,  employeeCap: 500  },
  enterprise: { label: "Enterprise", monthlyPrice: null, employeeCap: null },
};

// Fixed COGS per tenant/month, independent of AI spend (from docs/pricing.md).
const FIXED_COGS = {
  stripe_pct: 0.03, // 3% of subscription price
  vercel:     1.00,
  supabase:   0.65, // avg across tiers (~$0.50 Starter, $0.75 Growth, $1.00 Scale)
};

// AI cost concern threshold = 20% of monthly plan price.
// Above this level the AI cost line becomes meaningful relative to revenue.
// Returns null for Enterprise (no fixed price).
// Source: docs/pricing.md "When to revisit metering" section.
export function aiCostThreshold(tier: PlanTier): number | null {
  const price = TIER_CONFIG[tier].monthlyPrice;
  return price !== null ? price * 0.2 : null;
}

// Estimated gross margin given a tier and monthly AI spend.
// Formula: (revenue - ai_spend - fixed_cogs) / revenue
// Returns null for Enterprise (no fixed price to anchor the calculation).
export function impliedMargin(tier: PlanTier, aiSpendPerMonth: number): number | null {
  const price = TIER_CONFIG[tier].monthlyPrice;
  if (price === null) return null;
  const fixedCogs =
    FIXED_COGS.vercel +
    FIXED_COGS.supabase +
    price * FIXED_COGS.stripe_pct;
  const totalCogs = aiSpendPerMonth + fixedCogs;
  return Math.max(0, (price - totalCogs) / price);
}

// Tailwind utility classes for the plan tier badge.
export const TIER_BADGE_CLASSES: Record<PlanTier, string> = {
  starter:    "bg-zinc-500/15 text-zinc-400",
  growth:     "bg-blue-500/15 text-blue-400",
  scale:      "bg-purple-500/15 text-purple-400",
  enterprise: "bg-amber-500/15 text-amber-400",
};
