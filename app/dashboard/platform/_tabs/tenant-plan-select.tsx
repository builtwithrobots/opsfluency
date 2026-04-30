"use client";

import React, { useTransition } from "react";

import { TIER_CONFIG, type PlanTier } from "@/lib/types/billing";
import { setTenantPlanTier } from "../_actions/set-tenant-plan-tier";

export function TenantPlanSelect({
  companyId,
  currentTier,
}: {
  companyId: string;
  currentTier: PlanTier;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={currentTier}
      disabled={isPending}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
        const tier = e.target.value as PlanTier;
        startTransition(async () => {
          await setTenantPlanTier(companyId, tier);
        });
      }}
      className="rounded border border-[color:var(--dc-edge)] bg-dc-raised px-2 py-0.5 text-xs text-dc-text-2 disabled:opacity-50 cursor-pointer"
      title="Set subscription plan for this tenant"
    >
      {(Object.keys(TIER_CONFIG) as PlanTier[]).map((tier) => (
        <option key={tier} value={tier}>
          {TIER_CONFIG[tier].label}
        </option>
      ))}
    </select>
  );
}
