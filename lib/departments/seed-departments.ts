import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

// ── Types ─────────────────────────────────────────────────────────────────────

export type IndustryPackage = "general" | "iso9001" | "food-safety" | "healthcare";

interface DepartmentSeed {
  name: string;
  color_hex: string;
  icon_key: string;
  sort_order: number;
}

// ── Seed data ─────────────────────────────────────────────────────────────────
//
// Department names MUST match the keys in lib/sop/template-recommendations.ts
// exactly (case-insensitive lookup, but keeping the canonical casing here).
// HR is always last in every package — the departments actions guard prevents
// it from being renamed or deleted.

export const PACKAGE_DEPARTMENT_SEEDS: Record<IndustryPackage, DepartmentSeed[]> = {
  general: [
    { name: "Safety",    color_hex: "#ef4444", icon_key: "shield-check", sort_order: 0 },
    { name: "Equipment", color_hex: "#f97316", icon_key: "wrench",       sort_order: 1 },
    { name: "Process",   color_hex: "#3b82f6", icon_key: "settings",     sort_order: 2 },
    { name: "HR",        color_hex: "#14b8a6", icon_key: "users",        sort_order: 3 },
  ],

  iso9001: [
    { name: "Leadership",     color_hex: "#6366f1", icon_key: "briefcase",     sort_order: 0 },
    { name: "Planning",       color_hex: "#3b82f6", icon_key: "clipboard-list",sort_order: 1 },
    { name: "Operations",     color_hex: "#f97316", icon_key: "factory",       sort_order: 2 },
    { name: "Quality Control",color_hex: "#22c55e", icon_key: "flask-conical", sort_order: 3 },
    { name: "Support",        color_hex: "#f59e0b", icon_key: "headphones",    sort_order: 4 },
    { name: "HR",             color_hex: "#14b8a6", icon_key: "users",         sort_order: 5 },
  ],

  "food-safety": [
    { name: "Food Safety",        color_hex: "#22c55e", icon_key: "shield-check",   sort_order: 0 },
    { name: "Sanitation",         color_hex: "#06b6d4", icon_key: "clipboard-check",sort_order: 1 },
    { name: "Receiving & Storage",color_hex: "#f97316", icon_key: "package",        sort_order: 2 },
    { name: "Production",         color_hex: "#3b82f6", icon_key: "factory",        sort_order: 3 },
    { name: "Quality",            color_hex: "#22c55e", icon_key: "flask-conical",  sort_order: 4 },
    { name: "HR",                 color_hex: "#14b8a6", icon_key: "users",          sort_order: 5 },
  ],

  healthcare: [
    { name: "Clinical Procedures",color_hex: "#3b82f6", icon_key: "clipboard-list",  sort_order: 0 },
    { name: "Infection Control",  color_hex: "#ef4444", icon_key: "shield-check",    sort_order: 1 },
    { name: "Compliance",         color_hex: "#6366f1", icon_key: "clipboard-check", sort_order: 2 },
    { name: "Patient Safety",     color_hex: "#f59e0b", icon_key: "heart-pulse",     sort_order: 3 },
    { name: "Equipment",          color_hex: "#f97316", icon_key: "wrench",          sort_order: 4 },
    { name: "HR",                 color_hex: "#14b8a6", icon_key: "users",           sort_order: 5 },
  ],
};

// ── Seed function ─────────────────────────────────────────────────────────────

/**
 * Inserts the default departments for a new company based on its industry
 * package. Safe to call only once — throws if the company already has
 * departments, preventing duplicate seeding.
 *
 * Caller is responsible for passing the service-role Supabase client
 * (`getAdminClient()` from lib/supabase/admin.ts). RLS bypass is required
 * because this runs during onboarding before the user's JWT is associated
 * with the company row.
 */
export async function seedDepartmentsForPackage(
  supabase: SupabaseClient,
  company_id: string,
  industryPackage: IndustryPackage,
): Promise<void> {
  // Guard: abort if any departments already exist for this company.
  const { count, error: countError } = await supabase
    .from("departments")
    .select("id", { count: "exact", head: true })
    .eq("company_id", company_id);

  if (countError) {
    throw new Error(
      `seedDepartmentsForPackage: failed to check existing departments — ${countError.message}`,
    );
  }

  if (count !== null && count > 0) {
    throw new Error(
      `seedDepartmentsForPackage: company ${company_id} already has ${count} department(s). ` +
        `Seed aborted to prevent duplicates.`,
    );
  }

  const seeds = PACKAGE_DEPARTMENT_SEEDS[industryPackage];

  const rows = seeds.map((seed) => ({
    company_id,
    name: seed.name,
    color_hex: seed.color_hex,
    icon_key: seed.icon_key,
    sort_order: seed.sort_order,
    package_key: industryPackage,
  }));

  const { error: insertError } = await supabase.from("departments").insert(rows);

  if (insertError) {
    throw new Error(
      `seedDepartmentsForPackage: insert failed for company ${company_id} ` +
        `(package: ${industryPackage}) — ${insertError.message}`,
    );
  }
}
