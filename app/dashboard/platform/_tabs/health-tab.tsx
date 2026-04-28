import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getSuperAdminContext } from "@/lib/auth/super-admin-context";
import { getAdminClient } from "@/lib/supabase/admin";

type Severity = "ok" | "warn" | "fail";

interface HealthCheck {
  label: string;
  severity: Severity;
  detail: string;
}

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "ANTHROPIC_API_KEY",
  "GOOGLE_CLOUD_TRANSLATION_API_KEY",
  "NEXT_PUBLIC_APP_URL",
  "MONITOR_COOKIE_SECRET",
  "IMPERSONATION_COOKIE_SECRET",
] as const;

async function runChecks(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = [];

  // 1. JWT bridge. The super admin reached this page, which means the
  // layout's getSuperAdminContext call succeeded — the bridge is green.
  // Surfacing it explicitly still helps when debugging a different
  // account's claim that "I don't see my company."
  try {
    const { supabase } = await getSuperAdminContext();
    const { data, error } = await supabase.rpc("is_super_admin");
    if (error) throw error;
    checks.push({
      label: "Clerk → Supabase JWT bridge",
      severity: data ? "ok" : "fail",
      detail: data
        ? "Clerk session is reaching Supabase with the authenticated role."
        : "is_super_admin() returned false against the request client — check Supabase Third-party Auth + Clerk session_token `role` claim.",
    });
  } catch (e) {
    checks.push({
      label: "Clerk → Supabase JWT bridge",
      severity: "fail",
      detail: e instanceof Error ? e.message : "Unknown error",
    });
  }

  // 2. Super admin count. Zero is game-over; one is fragile (bus factor);
  // two or more is healthy.
  try {
    const admin = getAdminClient();
    const { count, error } = await admin
      .from("super_admins")
      .select("*", { count: "exact", head: true });
    if (error) throw error;
    const n = count ?? 0;
    checks.push({
      label: "Super admin bus factor",
      severity: n >= 2 ? "ok" : n === 1 ? "warn" : "fail",
      detail:
        n >= 2
          ? `${n} super admins configured.`
          : n === 1
            ? "Only one super admin configured. Consider granting a backup."
            : "No super admins configured — this screen should be unreachable.",
    });
  } catch (e) {
    checks.push({
      label: "Super admin bus factor",
      severity: "fail",
      detail: e instanceof Error ? e.message : "Unknown error",
    });
  }

  // 3. Env vars. Any missing required var is a warn (we don't fail loud
  // because every env is incomplete at some point during local setup).
  const missing = REQUIRED_ENV_VARS.filter((k) => !process.env[k]);
  checks.push({
    label: "Environment variables",
    severity: missing.length === 0 ? "ok" : "warn",
    detail:
      missing.length === 0
        ? `All ${REQUIRED_ENV_VARS.length} required variables are set.`
        : `Missing: ${missing.join(", ")}`,
  });

  // 4. Orphan check. A company with zero members is almost certainly
  // leftover state from a failed bootstrap or a demo-tenant delete
  // that didn't cascade somehow.
  try {
    const admin = getAdminClient();
    const { data: companies, error } = await admin
      .from("companies")
      .select("id")
      .eq("is_demo", false);
    if (error) throw error;
    const realIds = (companies ?? []).map((c) => c.id);

    let orphanCount = 0;
    if (realIds.length) {
      const { data: membershipRows, error: memberErr } = await admin
        .from("company_members")
        .select("company_id")
        .in("company_id", realIds);
      if (memberErr) throw memberErr;

      const withMembers = new Set((membershipRows ?? []).map((r) => r.company_id));
      orphanCount = realIds.filter((id) => !withMembers.has(id)).length;
    }

    checks.push({
      label: "Orphaned real tenants",
      severity: orphanCount === 0 ? "ok" : "warn",
      detail:
        orphanCount === 0
          ? "Every non-demo company has at least one member."
          : `${orphanCount} non-demo companies have zero members.`,
    });
  } catch (e) {
    checks.push({
      label: "Orphaned real tenants",
      severity: "fail",
      detail: e instanceof Error ? e.message : "Unknown error",
    });
  }

  // 5. Storage buckets. Missing buckets silently break SOP uploads and
  // QR print headers — they need to exist before any tenant can
  // actually use the product.
  try {
    const admin = getAdminClient();
    const buckets = ["sop-uploads", "company-logos"] as const;
    const missing: string[] = [];
    for (const name of buckets) {
      const { error } = await admin.storage.getBucket(name);
      if (error) missing.push(name);
    }
    checks.push({
      label: "Supabase storage buckets",
      severity: missing.length === 0 ? "ok" : "fail",
      detail:
        missing.length === 0
          ? "Both required buckets (sop-uploads, company-logos) exist."
          : `Missing bucket${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Create them in the Supabase Storage dashboard.`,
    });
  } catch (e) {
    checks.push({
      label: "Supabase storage buckets",
      severity: "fail",
      detail: e instanceof Error ? e.message : "Unknown error",
    });
  }

  // 6. Stuck SOPs. SOPs that have been sitting in a mid-pipeline status
  // (pending_terms or pending_translation) for more than 7 days likely
  // represent a manager who abandoned the import or a silent pipeline
  // failure. A warn here prompts investigation; it doesn't block anything.
  try {
    const admin = getAdminClient();
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { count, error } = await admin
      .from("sops")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending_terms", "pending_translation"])
      .lt("updated_at", sevenDaysAgo);
    if (error) throw error;
    const n = count ?? 0;
    checks.push({
      label: "Stuck SOP pipeline",
      severity: n === 0 ? "ok" : "warn",
      detail:
        n === 0
          ? "No SOPs have been stuck mid-pipeline for more than 7 days."
          : `${n} SOP${n === 1 ? "" : "s"} in pending_terms or pending_translation for >7 days. Check with the relevant tenant.`,
    });
  } catch (e) {
    checks.push({
      label: "Stuck SOP pipeline",
      severity: "fail",
      detail: e instanceof Error ? e.message : "Unknown error",
    });
  }

  return checks;
}

export async function HealthTab() {
  const checks = await runChecks();

  return (
    <section className="flex flex-col gap-4">
      <div>
        <Heading level={2} className="font-display text-xl">
          Platform health
        </Heading>
        <Text className="mt-1 max-w-2xl text-sm">
          Quick probes against the cross-tenant infrastructure. Run this
          first when a support ticket mentions &ldquo;I signed in and see
          nothing.&rdquo;
        </Text>
      </div>

      <ul className="divide-y divide-[color:var(--dc-edge)] overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
        {checks.map((c) => (
          <li key={c.label} className="flex items-start gap-3 px-5 py-4">
            <SeverityIcon severity={c.severity} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-dc-text">{c.label}</p>
              <p className="mt-0.5 text-xs text-dc-text-3">{c.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SeverityIcon({ severity }: { severity: Severity }) {
  if (severity === "ok") {
    return <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-(--color-signal-ok)" strokeWidth={2} />;
  }
  if (severity === "warn") {
    return <AlertTriangle className="mt-0.5 size-4 shrink-0 text-(--color-signal-warn)" strokeWidth={2} />;
  }
  return <XCircle className="mt-0.5 size-4 shrink-0 text-(--color-signal-urgent)" strokeWidth={2} />;
}
