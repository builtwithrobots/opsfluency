"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSuperAdminContext } from "@/lib/auth/super-admin-context";
import { DEMO_PRESETS, getPreset, type DemoPreset, type DemoPresetId } from "@/lib/platform/demo-presets";
import { getAdminClient } from "@/lib/supabase/admin";

/**
 * Create / refresh / delete a demo tenant. All three go through the
 * service-role client because:
 *  - `bootstrap_demo_company` and `delete_demo_tenant` are REVOKE'd
 *    from authenticated; only service_role has EXECUTE.
 *  - Bulk inserting the preset payload (qr_codes, qr_scans) sidesteps
 *    RLS — super admins technically have a god-mode bypass, but the
 *    admin client is clearer at the call site and avoids a round trip
 *    through the JWT client.
 *
 * Every entry point re-verifies super-admin status via
 * `getSuperAdminContext()` before any write. The super admin's
 * `clerk_user_id` is threaded through as the `created_by` field on
 * qr_codes so the audit trail points to a real human.
 */

const CreateInput = z.object({
  preset: z.enum(
    Object.keys(DEMO_PRESETS) as [DemoPresetId, ...DemoPresetId[]],
  ),
});

const CompanyIdInput = z.object({
  company_id: z.string().uuid(),
});

export async function createDemoTenant(formData: FormData): Promise<void> {
  const { userId: superAdminUserId } = await getSuperAdminContext();
  const { preset } = CreateInput.parse({
    preset: formData.get("preset"),
  });

  const presetData = DEMO_PRESETS[preset];
  await seedOneTenant(presetData, superAdminUserId);

  revalidatePath("/dashboard/platform");
}

export async function refreshDemoTenant(formData: FormData): Promise<void> {
  const { userId: superAdminUserId } = await getSuperAdminContext();

  const { company_id } = CompanyIdInput.parse({
    company_id: formData.get("company_id"),
  });

  const presetId = formData.get("preset");
  const preset = getPreset(typeof presetId === "string" ? presetId : undefined);
  if (!preset) {
    throw new Error(`Unknown or missing preset: ${String(presetId)}`);
  }

  // Two-step: delete then re-seed. The delete RPC enforces is_demo=true,
  // so a stray refresh against a real tenant throws from Postgres
  // before we get anywhere near the re-seed step.
  await deleteOneTenant(company_id);
  await seedOneTenant(preset, superAdminUserId);

  revalidatePath("/dashboard/platform");
}

export async function deleteDemoTenant(formData: FormData): Promise<void> {
  await getSuperAdminContext();

  const { company_id } = CompanyIdInput.parse({
    company_id: formData.get("company_id"),
  });

  await deleteOneTenant(company_id);
  revalidatePath("/dashboard/platform");
}

// ─── Internals ──────────────────────────────────────────────────────

async function seedOneTenant(
  preset: DemoPreset,
  superAdminClerkUserId: string,
): Promise<string> {
  // Admin client is required here: `bootstrap_demo_company` is REVOKE'd
  // from authenticated and the subsequent bulk inserts need to run
  // without any company_id scoping from a JWT client.
  const admin = getAdminClient();

  const { data: company, error: companyError } = await admin.rpc(
    "bootstrap_demo_company",
    {
      p_name: preset.companyName,
      p_admin_clerk_user_id: superAdminClerkUserId,
    },
  );
  if (companyError) throw companyError;

  // supabase-js sometimes unwraps a composite-typed RPC as an array.
  const row = Array.isArray(company) ? company[0] : company;
  if (!row?.id) throw new Error("bootstrap_demo_company returned no row");
  const companyId: string = row.id;

  // QR codes. All `target_type='url'` — sop targets will come online
  // when the sops table ships (see demo-presets.ts header comment).
  const qrRows = preset.qrCodes.map((qr) => ({
    company_id: companyId,
    target_type: "url" as const,
    target_url: qr.targetUrl,
    label: qr.label,
    created_by: superAdminClerkUserId,
    print_config: {},
  }));

  const { data: insertedQrs, error: qrError } = await admin
    .from("qr_codes")
    .insert(qrRows)
    .select("id");
  if (qrError) throw qrError;

  // Scan history — deterministic-ish spread over the last 30 days so
  // every demo tenant has non-trivial analytics out of the box.
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const scanRows: {
    qr_code_id: string;
    company_id: string;
    scanned_at: string;
  }[] = [];

  for (const qr of insertedQrs ?? []) {
    for (let i = 0; i < preset.scansPerCode; i++) {
      const offset = Math.random() * thirtyDaysMs;
      scanRows.push({
        qr_code_id: qr.id,
        company_id: companyId,
        scanned_at: new Date(now - offset).toISOString(),
      });
    }
  }

  if (scanRows.length) {
    const { error: scanError } = await admin.from("qr_scans").insert(scanRows);
    if (scanError) throw scanError;
  }

  return companyId;
}

async function deleteOneTenant(companyId: string): Promise<void> {
  const admin = getAdminClient();
  const { error } = await admin.rpc("delete_demo_tenant", {
    p_company_id: companyId,
  });
  if (error) throw error;
}
