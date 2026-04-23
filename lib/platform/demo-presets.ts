import "server-only";

/**
 * Demo tenant presets for the super-admin Seed tab.
 *
 * Each preset describes a realistic populated tenant. The seed Server
 * Action consumes one of these, invokes `bootstrap_demo_company` to
 * create the company + admin + departments, then inserts the rest of
 * the preset data (qr_codes, qr_scans) via the admin client.
 *
 * Extension point: when `sops`, `sop_versions`, `glossary_terms`,
 * `employees`, and `announcements` tables land, add parallel fields
 * here (sops, glossaryTerms, employees, announcements) and extend
 * the Server Action's insert loop to cover them. The preset shape is
 * additive — older presets missing the new fields will still work.
 */

export type DemoPresetId = "warehouse" | "manufacturing" | "cold-storage";

export interface DemoQrCode {
  label: string;
  /**
   * QR codes in the MVP preset all use `target_type = 'url'` because
   * the `sops` table doesn't exist yet. When it does, add a
   * `target_type: 'sop'` variant and the Server Action can resolve a
   * just-seeded sop_id instead of a static URL.
   */
  targetUrl: string;
}

export interface DemoPreset {
  id: DemoPresetId;
  displayName: string;
  companyName: string;
  description: string;
  qrCodes: DemoQrCode[];
  /** Scans generated per QR code, backdated uniformly over the last 30 days. */
  scansPerCode: number;
}

const warehouse: DemoPreset = {
  id: "warehouse",
  displayName: "Warehouse — Midwest Distribution",
  companyName: "Demo Warehouse",
  description:
    "Four SOPs spread across Safety and Equipment. Typical scan volume for a 60-employee distribution facility.",
  qrCodes: [
    { label: "Forklift pre-shift inspection", targetUrl: "https://example.com/demo/forklift-inspection" },
    { label: "Pallet jack safe operation",     targetUrl: "https://example.com/demo/pallet-jack" },
    { label: "PPE checklist — receiving dock", targetUrl: "https://example.com/demo/ppe-receiving" },
    { label: "Lockout / tagout procedure",     targetUrl: "https://example.com/demo/loto" },
    { label: "Emergency exit routes",          targetUrl: "https://example.com/demo/emergency-exits" },
    { label: "Hand washing — break room",      targetUrl: "https://example.com/demo/handwashing" },
  ],
  scansPerCode: 18,
};

const manufacturing: DemoPreset = {
  id: "manufacturing",
  displayName: "Manufacturing — Injection Molding",
  companyName: "Demo Manufacturing",
  description:
    "Process-heavy SOP mix with higher scan cadence, representative of a 120-employee plant running two shifts.",
  qrCodes: [
    { label: "Injection press startup",        targetUrl: "https://example.com/demo/press-startup" },
    { label: "Mold change — safety protocol",  targetUrl: "https://example.com/demo/mold-change" },
    { label: "Quality inspection checklist",   targetUrl: "https://example.com/demo/qc-checklist" },
    { label: "Material handling — resin",      targetUrl: "https://example.com/demo/resin-handling" },
    { label: "PPE — hearing protection zone",  targetUrl: "https://example.com/demo/hearing-protection" },
    { label: "Spill response",                 targetUrl: "https://example.com/demo/spill-response" },
    { label: "Shift handoff procedure",        targetUrl: "https://example.com/demo/shift-handoff" },
  ],
  scansPerCode: 26,
};

const coldStorage: DemoPreset = {
  id: "cold-storage",
  displayName: "Cold Storage — Freezer Warehouse",
  companyName: "Demo Cold Storage",
  description:
    "Small SOP set focused on cold-chain safety. Lower scan volume reflecting a 25-employee facility.",
  qrCodes: [
    { label: "Freezer entry PPE",              targetUrl: "https://example.com/demo/freezer-ppe" },
    { label: "Cold-chain temperature log",     targetUrl: "https://example.com/demo/temp-log" },
    { label: "Pallet receiving — frozen",      targetUrl: "https://example.com/demo/pallet-receiving" },
    { label: "Emergency evacuation — cold",    targetUrl: "https://example.com/demo/cold-evac" },
  ],
  scansPerCode: 10,
};

export const DEMO_PRESETS: Record<DemoPresetId, DemoPreset> = {
  warehouse,
  manufacturing,
  "cold-storage": coldStorage,
};

export const DEMO_PRESET_LIST: readonly DemoPreset[] = [
  warehouse,
  manufacturing,
  coldStorage,
] as const;

export function getPreset(id: string | undefined): DemoPreset | null {
  if (!id) return null;
  return (DEMO_PRESETS as Record<string, DemoPreset | undefined>)[id] ?? null;
}
