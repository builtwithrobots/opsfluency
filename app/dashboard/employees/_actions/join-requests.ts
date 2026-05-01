"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { getCompanyContext, AuthError } from "@/lib/auth/company-context";

const RequestIdInput = z.object({ id: z.string().uuid() });

export type ApproveResult =
  | { ok: true; claimUrl: string; employeeName: string | null }
  | { ok: false; error: { code: string; message?: string } };

export async function approveJoinRequest(formData: FormData): Promise<ApproveResult> {
  try {
    const { supabase, company_id, userId } = await getCompanyContext("manager");
    const { id } = RequestIdInput.parse({ id: formData.get("id") });

    const { data: request } = await supabase
      .from("employee_join_requests")
      .select("id, phone, name, email_personal, status")
      .eq("id", id)
      .eq("company_id", company_id)
      .eq("status", "pending")
      .single();

    if (!request) {
      return { ok: false, error: { code: "NOT_FOUND" } };
    }

    const personalInviteToken = crypto.randomUUID();
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    const { data: invite, error: inviteError } = await supabase
      .from("employee_invites")
      .insert({
        company_id,
        phone: request.phone,
        name: request.name,
        email_personal: request.email_personal ?? null,
        department_ids: [],
        invited_by: userId,
        personal_invite_token: personalInviteToken,
        personal_invite_token_expires_at: tokenExpiresAt,
      })
      .select("id")
      .single();

    if (inviteError || !invite) {
      return { ok: false, error: { code: "INTERNAL", message: inviteError?.message } };
    }

    await supabase
      .from("employee_join_requests")
      .update({
        status: "approved",
        reviewed_at: now,
        reviewed_by: userId,
        created_invite_id: invite.id,
      })
      .eq("id", id);

    const hdrs = await headers();
    const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
    const proto = hdrs.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";
    const claimUrl = `${proto}://${host}/join/claim/${personalInviteToken}`;

    revalidatePath("/dashboard/employees");
    return { ok: true, claimUrl, employeeName: request.name ?? null };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { ok: false, error: { code: "INVALID_INPUT" } };
    }
    if (e instanceof AuthError) {
      return { ok: false, error: { code: e.code } };
    }
    throw e;
  }
}

export type RejectResult =
  | { ok: true }
  | { ok: false; error: { code: string } };

export async function rejectJoinRequest(formData: FormData): Promise<RejectResult> {
  try {
    const { supabase, company_id, userId } = await getCompanyContext("manager");
    const { id } = RequestIdInput.parse({ id: formData.get("id") });

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("employee_join_requests")
      .update({ status: "rejected", reviewed_at: now, reviewed_by: userId })
      .eq("id", id)
      .eq("company_id", company_id)
      .eq("status", "pending");

    if (error) return { ok: false, error: { code: "INTERNAL" } };

    revalidatePath("/dashboard/employees");
    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: { code: "INVALID_INPUT" } };
    if (e instanceof AuthError) return { ok: false, error: { code: e.code } };
    throw e;
  }
}
