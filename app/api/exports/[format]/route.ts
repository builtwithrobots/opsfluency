import { NextResponse } from "next/server";
import { z } from "zod";

import { AuthError, getCompanyContext } from "@/lib/auth/company-context";
import { writeExportAuditRow } from "@/lib/export/audit";
import { assembleOrgBundle } from "@/lib/export/bundle";
import { buildGlossaryCsv, buildSopsCsv, buildTeamCsv } from "@/lib/export/csv";
import { checkExportRateLimit } from "@/lib/export/rate-limit";
import {
  EXPORT_FORMATS,
  type ExportFormat,
  type GlossaryTermExport,
  type SopExport,
  type TeamMemberExport,
} from "@/lib/types/export";

const FormatSchema = z.enum(EXPORT_FORMATS);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ format: string }> },
) {
  try {
    // 1. Auth: admin-only. Throws AuthError for unauthenticated, no-company, wrong-role.
    const { supabase, company_id, userId } = await getCompanyContext("admin");

    // 2. Validate format param before any DB work.
    const { format: rawFormat } = await params;
    const format = FormatSchema.parse(rawFormat) as ExportFormat;

    // 3. Rate limit: 5 exports per company per rolling hour.
    const rateLimit = await checkExportRateLimit(company_id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: `Export limit reached. Up to 5 exports per hour. Resets at ${rateLimit.reset_at}.`,
          },
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimit.reset_at,
          },
        },
      );
    }

    // 4. Assemble payload. The supabase client from getCompanyContext carries the
    //    Clerk JWT — RLS enforces company_id at the DB layer for every query.
    let body: string;
    let contentType: string;
    let filename: string;
    let rowCount: number;
    const dateStr = new Date().toISOString().slice(0, 10);

    if (format === "json") {
      const bundle = await assembleOrgBundle(supabase, company_id);
      rowCount =
        bundle.sops.length +
        bundle.glossary_terms.length +
        bundle.team_members.length +
        bundle.announcements.length +
        bundle.sop_versions.length;
      body = JSON.stringify(bundle, null, 2);
      contentType = "application/json";
      filename = `opsfluency-export-${dateStr}.json`;
    } else if (format === "csv_sops") {
      const { data: sops } = await supabase
        .from("sops")
        .select(
          "id, title, status, template, department_id, created_by, created_at, updated_at, archived_at",
        )
        .eq("company_id", company_id)
        .order("created_at");
      const { data: sopTagRows } = await supabase
        .from("sop_tags")
        .select("sop_id, tag_id");
      const sopTagMap: Record<string, string[]> = {};
      for (const r of sopTagRows ?? []) {
        (sopTagMap[r.sop_id] ??= []).push(r.tag_id);
      }
      const sopsWithTags = (sops ?? [] as Omit<SopExport, "tags">[]).map((s) => ({
        ...s,
        tags: sopTagMap[s.id] ?? [],
      })) as SopExport[];
      rowCount = sopsWithTags.length;
      body = buildSopsCsv(sopsWithTags);
      contentType = "text/csv";
      filename = `opsfluency-sops-${dateStr}.csv`;
    } else if (format === "csv_glossary") {
      const { data: terms } = await supabase
        .from("glossary_terms")
        .select(
          "id, term_en, definition_en, term_es, definition_es, created_by, created_at, updated_at, deleted_at",
        )
        .eq("company_id", company_id)
        .order("term_en");
      const { data: termTagRows } = await supabase
        .from("glossary_term_tags")
        .select("term_id, tag_id");
      const glossaryTagMap: Record<string, string[]> = {};
      for (const r of termTagRows ?? []) {
        (glossaryTagMap[r.term_id] ??= []).push(r.tag_id);
      }
      const termsWithTags = (terms ?? [] as Omit<GlossaryTermExport, "tags">[]).map((t) => ({
        ...t,
        tags: glossaryTagMap[t.id] ?? [],
      })) as GlossaryTermExport[];
      rowCount = termsWithTags.length;
      body = buildGlossaryCsv(termsWithTags);
      contentType = "text/csv";
      filename = `opsfluency-glossary-${dateStr}.csv`;
    } else {
      // csv_team
      const { data: members } = await supabase
        .from("company_members")
        .select(
          "id, clerk_user_id, role, preferred_language, is_owner, invited_at, joined_at, locked_at",
        )
        .eq("company_id", company_id)
        .order("joined_at");
      const { data: deptRows } = await supabase
        .from("employee_departments")
        .select("member_id, department_id")
        .eq("company_id", company_id);
      const memberDepts: Record<string, string[]> = {};
      for (const r of deptRows ?? []) {
        (memberDepts[r.member_id] ??= []).push(r.department_id);
      }
      const membersWithDepts = (members ?? [] as Omit<TeamMemberExport, "department_ids">[]).map((m) => ({
        ...m,
        department_ids: memberDepts[m.id] ?? [],
      })) as TeamMemberExport[];
      rowCount = membersWithDepts.length;
      body = buildTeamCsv(membersWithDepts);
      contentType = "text/csv";
      filename = `opsfluency-team-${dateStr}.csv`;
    }

    // 5. Write audit row after successful assembly — we only log completed exports,
    //    not attempts that failed mid-query.
    const entityScope =
      format === "json"
        ? "full"
        : format === "csv_sops"
          ? "sops"
          : format === "csv_glossary"
            ? "glossary"
            : "team";

    await writeExportAuditRow({
      company_id,
      exported_by: userId,
      format,
      entity_scope: entityScope,
      row_count: rowCount,
      request,
    });

    // 6. Stream directly to the browser. Content-Disposition forces a file download.
    //    No copy is written to Supabase Storage or the filesystem — bytes travel
    //    DB → process memory → TLS → browser only.
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": `${contentType}; charset=utf-8`,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-RateLimit-Limit": "5",
        "X-RateLimit-Remaining": String(rateLimit.remaining - 1),
        "X-RateLimit-Reset": rateLimit.reset_at,
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_FORMAT",
            message:
              "Supported formats: json, csv_sops, csv_glossary, csv_team",
          },
        },
        { status: 400 },
      );
    }
    if (e instanceof AuthError) {
      if (e.code === "UNAUTHENTICATED")
        return NextResponse.json({ error: { code: e.code } }, { status: 401 });
      return NextResponse.json({ error: { code: e.code } }, { status: 403 });
    }
    throw e;
  }
}
