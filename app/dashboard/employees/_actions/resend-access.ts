"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { z } from "zod";

import { getCompanyContext, AuthError } from "@/lib/auth/company-context";

const Input = z.object({ clerk_user_id: z.string().min(1) });

export type ResendAccessResult =
  | { ok: true; claimUrl: string; displayName: string | null }
  | { ok: false; error: { code: string; message?: string } };

export async function resendAccessLink(
  formData: FormData,
): Promise<ResendAccessResult> {
  try {
    const { supabase, company_id } = await getCompanyContext("manager");
    const { clerk_user_id } = Input.parse({ clerk_user_id: formData.get("clerk_user_id") });

    // Confirm the user is an employee of this company — never issue tokens
    // for users outside the manager's own company.
    const { data: member } = await supabase
      .from("company_members")
      .select("id")
      .eq("company_id", company_id)
      .eq("clerk_user_id", clerk_user_id)
      .eq("role", "employee")
      .maybeSingle();

    if (!member) return { ok: false, error: { code: "NOT_FOUND" } };

    const clerk = await clerkClient();

    // Fetch name for display in the QR card
    let displayName: string | null = null;
    try {
      const user = await clerk.users.getUser(clerk_user_id);
      displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
    } catch {
      // Non-fatal — we still issue the token
    }

    const token = await clerk.signInTokens.createSignInToken({
      userId: clerk_user_id,
      expiresInSeconds: 3600, // 1 hour — same as initial claim
    });

    const hdrs = await headers();
    const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
    const proto = hdrs.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";
    const claimUrl = `${proto}://${host}/sign-in?__clerk_ticket=${token.token}&redirect_url=%2Fapp%2Fhome`;

    return { ok: true, claimUrl, displayName };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: { code: "INVALID_INPUT" } };
    if (e instanceof AuthError) return { ok: false, error: { code: e.code } };
    throw e;
  }
}
