"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCompanyContext } from "@/lib/auth/company-context";

// Each row is pre-validated client-side (phone normalized to E.164, dept names
// resolved to UUIDs). Server re-validates the shape and checks for duplicates.
const BulkInviteRow = z.object({
  phone: z.string().regex(/^\+1\d{10}$/, "Invalid E.164 phone"),
  name: z.string().max(100).nullable(),
  email_work: z.string().email().nullable().or(z.literal("")).transform((v) => v || null),
  email_personal: z.string().email().nullable().or(z.literal("")).transform((v) => v || null),
  department_ids: z.array(z.string().uuid()).default([]),
});

export type BulkCreateResult =
  | { ok: true; created: number; skipped: { row: number; reason: string }[] }
  | { ok: false; error: { code: string; message?: string } };

export async function bulkCreateInvites(rows: unknown[]): Promise<BulkCreateResult> {
  try {
    const { supabase, userId, company_id } = await getCompanyContext("manager");

    const validated = z.array(BulkInviteRow).parse(rows);
    if (validated.length === 0) return { ok: true, created: 0, skipped: [] };

    // Check which phones already have an unclaimed invite
    const phones = validated.map((r) => r.phone);
    const { data: existing } = await supabase
      .from("employee_invites")
      .select("phone")
      .eq("company_id", company_id)
      .in("phone", phones)
      .is("claimed_at", null);

    const existingPhones = new Set((existing ?? []).map((r: { phone: string }) => r.phone));

    const skipped: { row: number; reason: string }[] = [];
    const toInsert: {
      company_id: string;
      phone: string;
      name: string | null;
      email_work: string | null;
      email_personal: string | null;
      department_ids: string[];
      invited_by: string;
      personal_invite_token: string;
      personal_invite_token_expires_at: string;
    }[] = [];

    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    for (let i = 0; i < validated.length; i++) {
      const row = validated[i];
      if (existingPhones.has(row.phone)) {
        skipped.push({ row: i + 1, reason: "Invite already exists for this number" });
        continue;
      }
      toInsert.push({
        company_id,
        phone: row.phone,
        name: row.name,
        email_work: row.email_work,
        email_personal: row.email_personal,
        department_ids: row.department_ids,
        invited_by: userId,
        personal_invite_token: crypto.randomUUID(),
        personal_invite_token_expires_at: tokenExpiresAt,
      });
    }

    let created = 0;
    if (toInsert.length > 0) {
      const { data, error } = await supabase
        .from("employee_invites")
        .insert(toInsert)
        .select("id");

      if (error) {
        return { ok: false, error: { code: "INTERNAL", message: error.message } };
      }
      created = data?.length ?? 0;
    }

    revalidatePath("/dashboard/employees");
    return { ok: true, created, skipped };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { ok: false, error: { code: "INVALID_INPUT", message: e.issues[0]?.message } };
    }
    throw e;
  }
}
