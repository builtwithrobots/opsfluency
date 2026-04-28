"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AuthError, getCompanyContext } from "@/lib/auth/company-context";

const CreateInput = z.object({
  email: z.string().email("Enter a valid email address."),
  name: z.string().trim().max(200).optional(),
  role: z.enum(["admin", "manager"]),
  department_ids: z.array(z.string().uuid()).default([]),
});

const DeleteInput = z.object({
  invite_id: z.string().uuid(),
});

const BulkRow = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(["admin", "manager"]),
  department_ids: z.array(z.string().uuid()).default([]),
});

export type TeamInviteResult =
  | { ok: true; token: string }
  | { ok: false; error: { code: string; message?: string } };

export type BulkTeamInviteResult =
  | { ok: true; created: number; skipped: { row: number; reason: string }[] }
  | { ok: false; error: { code: string; message?: string } };

export async function createTeamInvite(
  formData: FormData,
): Promise<TeamInviteResult> {
  try {
    const { supabase, company_id, userId } = await getCompanyContext("admin");

    const rawDeptIds = formData.getAll("department_ids").filter(
      (v): v is string => typeof v === "string" && v.length > 0,
    );

    const parsed = CreateInput.parse({
      email: formData.get("email"),
      name: formData.get("name") || undefined,
      role: formData.get("role"),
      department_ids: rawDeptIds,
    });

    const { data, error } = await supabase
      .from("team_invites")
      .insert({
        company_id,
        email: parsed.email,
        name: parsed.name ?? null,
        role: parsed.role,
        department_ids: parsed.department_ids,
        invited_by: userId,
      })
      .select("token")
      .single();

    if (error?.code === "23505") {
      return {
        ok: false,
        error: {
          code: "DUPLICATE_EMAIL",
          message: "An unclaimed invite already exists for that email.",
        },
      };
    }
    if (error) throw error;

    revalidatePath("/dashboard/org-settings");
    return { ok: true, token: data.token };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return {
        ok: false,
        error: { code: "INVALID_INPUT", message: e.issues[0]?.message },
      };
    }
    if (e instanceof AuthError) return { ok: false, error: { code: e.code } };
    throw e;
  }
}

export async function deleteTeamInvite(formData: FormData): Promise<void> {
  const { supabase, company_id } = await getCompanyContext("admin");

  const { invite_id } = DeleteInput.parse({
    invite_id: formData.get("invite_id"),
  });

  const { error } = await supabase
    .from("team_invites")
    .delete()
    .eq("id", invite_id)
    .eq("company_id", company_id)
    .is("claimed_at", null);
  if (error) throw error;

  revalidatePath("/dashboard/org-settings");
}

export async function bulkCreateTeamInvites(
  rows: unknown[],
): Promise<BulkTeamInviteResult> {
  try {
    const { supabase, company_id, userId } = await getCompanyContext("admin");

    const valid: z.infer<typeof BulkRow>[] = [];
    const skipped: { row: number; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const parsed = BulkRow.safeParse(rows[i]);
      if (!parsed.success) {
        skipped.push({
          row: i + 2,
          reason: parsed.error.issues[0]?.message ?? "Invalid row",
        });
      } else {
        valid.push(parsed.data);
      }
    }

    if (valid.length === 0) return { ok: true, created: 0, skipped };

    const emails = valid.map((r) => r.email.toLowerCase());
    const { data: existing } = await supabase
      .from("team_invites")
      .select("email")
      .eq("company_id", company_id)
      .is("claimed_at", null)
      .in("email", emails);

    const existingEmails = new Set(
      (existing ?? []).map((r: { email: string }) => r.email.toLowerCase()),
    );

    const toInsert: {
      company_id: string;
      email: string;
      name: string | null;
      role: string;
      department_ids: string[];
      invited_by: string;
    }[] = [];

    for (let i = 0; i < valid.length; i++) {
      const r = valid[i];
      if (existingEmails.has(r.email.toLowerCase())) {
        skipped.push({
          row: i + 2,
          reason: `Unclaimed invite already exists for ${r.email}`,
        });
      } else {
        toInsert.push({
          company_id,
          email: r.email,
          name: r.name?.trim() || null,
          role: r.role,
          department_ids: r.department_ids,
          invited_by: userId,
        });
      }
    }

    if (toInsert.length === 0) return { ok: true, created: 0, skipped };

    const { error } = await supabase.from("team_invites").insert(toInsert);
    if (error) throw error;

    revalidatePath("/dashboard/org-settings");
    return { ok: true, created: toInsert.length, skipped };
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: { code: e.code } };
    throw e;
  }
}
