import { Download, FileJson, FileSpreadsheet, Lock, Sheet, Shield, ShieldCheck } from "lucide-react";

import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getAdminClient } from "@/lib/supabase/admin";
import { getCompanyContext } from "@/lib/auth/company-context";

const FORMAT_LABELS: Record<string, string> = {
  xlsx: "Full org workbook (Excel)",
  json: "Full org bundle (JSON)",
  csv_sops: "SOPs (CSV)",
  csv_glossary: "Glossary (CSV)",
  csv_team: "Team members (CSV)",
};

// Reads data_export_events via the admin client — that table is revoked from
// anon/authenticated, so the RLS client cannot read it. Admin client
// justified: reading our own audit infrastructure to display the export history.
async function loadRecentExports(company_id: string) {
  const admin = getAdminClient();
  const { data } = await admin
    .from("data_export_events")
    .select("id, exported_by, format, entity_scope, row_count, exported_at")
    .eq("company_id", company_id)
    .order("exported_at", { ascending: false })
    .limit(5);
  return data ?? [];
}

export async function ExportsTab() {
  const { company_id } = await getCompanyContext("admin");
  const recentExports = await loadRecentExports(company_id);

  return (
    <section className="flex max-w-3xl flex-col gap-8">
      {/* Security callout */}
      <div className="rounded-xl border border-(--color-brand)/20 bg-(--color-brand)/5 px-5 py-4">
        <div className="flex items-start gap-3">
          <ShieldCheck
            className="mt-0.5 size-5 shrink-0 text-(--color-brand)"
            strokeWidth={2}
          />
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-dc-text">
              Your data is protected
            </p>
            <ul className="flex flex-col gap-1.5 text-xs text-dc-text-3">
              <li className="flex items-start gap-1.5">
                <Lock className="mt-0.5 size-3 shrink-0" strokeWidth={2} />
                Only org admins can trigger an export
              </li>
              <li className="flex items-start gap-1.5">
                <Shield className="mt-0.5 size-3 shrink-0" strokeWidth={2} />
                Exports are scoped to your company only — enforced at the
                database layer by PostgreSQL Row Level Security
              </li>
              <li className="flex items-start gap-1.5">
                <Download className="mt-0.5 size-3 shrink-0" strokeWidth={2} />
                Files stream directly to your browser — no copy is stored on
                our servers
              </li>
            </ul>
            <p className="text-xs text-dc-text-3">
              Every export is logged. Rate limit: 5 exports per hour.
            </p>
          </div>
        </div>
      </div>

      {/* Full org bundle */}
      <div>
        <Heading level={2} className="text-xl">
          Full org export
        </Heading>
        <Text className="mt-1 max-w-2xl text-sm">
          Export everything — SOPs and their content (English + Spanish),
          glossary, departments, tags, announcements, QR codes, and team
          members. Choose Excel for spreadsheets or JSON for developer use.
        </Text>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/api/exports/xlsx"
            download
            className="inline-flex items-center gap-2 rounded-md border border-(--color-brand)/30 bg-(--color-brand)/10 px-4 py-2 text-sm font-medium text-(--color-brand) hover:bg-(--color-brand)/20"
          >
            <Sheet className="size-4" strokeWidth={2} />
            Download Excel workbook (.xlsx)
          </a>
          <a
            href="/api/exports/json"
            download
            className="inline-flex items-center gap-2 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-4 py-2 text-sm font-medium text-dc-text hover:bg-dc-overlay"
          >
            <FileJson className="size-4" strokeWidth={2} />
            Download JSON bundle (.json)
          </a>
        </div>
        <p className="mt-2 text-xs text-dc-text-3">
          Excel workbook includes separate sheets for SOPs, Glossary, Team, Departments, Announcements, and QR Codes.
        </p>
      </div>

      {/* Individual CSV exports */}
      <div>
        <Heading level={2} className="text-xl">
          Individual exports
        </Heading>
        <Text className="mt-1 max-w-2xl text-sm">
          Download specific data sets as CSV files for spreadsheets or other
          tools.
        </Text>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/api/exports/csv_sops"
            download
            className="inline-flex items-center gap-2 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-4 py-2 text-sm font-medium text-dc-text hover:bg-dc-overlay"
          >
            <FileSpreadsheet className="size-4" strokeWidth={2} />
            SOPs (.csv)
          </a>
          <a
            href="/api/exports/csv_glossary"
            download
            className="inline-flex items-center gap-2 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-4 py-2 text-sm font-medium text-dc-text hover:bg-dc-overlay"
          >
            <FileSpreadsheet className="size-4" strokeWidth={2} />
            Glossary (.csv)
          </a>
          <a
            href="/api/exports/csv_team"
            download
            className="inline-flex items-center gap-2 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-4 py-2 text-sm font-medium text-dc-text hover:bg-dc-overlay"
          >
            <FileSpreadsheet className="size-4" strokeWidth={2} />
            Team members (.csv)
          </a>
        </div>
        <p className="mt-3 max-w-2xl text-xs text-dc-text-3">
          Note: team member email addresses are managed by Clerk (your identity
          provider) and are not stored in OpsFluency&apos;s database. The CSV
          includes the Clerk user ID for each member. Contact support for a
          combined export with email addresses.
        </p>
      </div>

      {/* Export audit trail */}
      <div>
        <Heading level={2} className="text-xl">
          Export audit trail
        </Heading>
        <Text className="mt-1 max-w-2xl text-sm">
          Every download is logged. Showing the 5 most recent exports for your
          org.
        </Text>

        {recentExports.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-8 text-center">
            <p className="text-sm text-dc-text-2">No exports yet.</p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-[color:var(--dc-edge)] overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
            {recentExports.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-4 px-5 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-dc-text">
                    {FORMAT_LABELS[e.format] ?? e.format}
                  </p>
                  <p className="mt-0.5 text-xs text-dc-text-3">
                    By {e.exported_by} &middot;{" "}
                    {new Date(e.exported_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {e.row_count != null ? ` · ${e.row_count} rows` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
