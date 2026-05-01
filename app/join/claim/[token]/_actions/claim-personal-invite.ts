"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAdminClient } from "@/lib/supabase/admin";
import { isClaimRateLimited, hashIp } from "@/lib/employees/claim-rate-limit";

export type PersonalClaimState = { error: string } | null;

// Generic terminal error — never reveals whether a token exists, is expired, or is claimed.
const GENERIC_CLAIM_ERROR =
  "Something went wrong. Please try again or ask your manager for help.";

export async function claimPersonalInvite(
  _prev: PersonalClaimState,
  formData: FormData,
): Promise<PersonalClaimState> {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown";
  if (isClaimRateLimited(hashIp(ip))) return { error: GENERIC_CLAIM_ERROR };

  const token = (formData.get("token") as string | null)?.trim();
  if (!token) return { error: GENERIC_CLAIM_ERROR };

  const admin = getAdminClient();

  // Admin client justified: no Clerk session exists yet for this user.
  // Lookup by token — the partial index on unclaimed rows makes this O(1).
  const { data: invite } = await admin
    .from("employee_invites")
    .select("id, company_id, name, email_work, email_personal, department_ids, claimed_at, personal_invite_token_expires_at")
    .eq("personal_invite_token", token)
    .maybeSingle();

  if (!invite) return { error: GENERIC_CLAIM_ERROR };
  if (invite.claimed_at) return { error: GENERIC_CLAIM_ERROR };

  const expiresAt = invite.personal_invite_token_expires_at
    ? new Date(invite.personal_invite_token_expires_at as string)
    : null;
  if (expiresAt && expiresAt < new Date()) return { error: GENERIC_CLAIM_ERROR };

  const companyId = invite.company_id as string;
  const clerk = await clerkClient();

  const clerkEmail =
    (invite.email_personal as string | null) ??
    (invite.email_work as string | null) ??
    null;

  let clerkUserId: string;
  try {
    const nameParts = ((invite.name as string | null) ?? "").split(" ").filter(Boolean);
    const user = await clerk.users.createUser({
      firstName: nameParts[0] ?? undefined,
      lastName: nameParts.slice(1).join(" ") || undefined,
      ...(clerkEmail ? { emailAddress: [clerkEmail] } : {}),
      skipPasswordRequirement: true,
    });
    clerkUserId = user.id;
  } catch (err: unknown) {
    let msg = "Failed to create your account.";
    if (err && typeof err === "object") {
      const clerkErr = err as { errors?: { message: string }[]; message?: string };
      if (Array.isArray(clerkErr.errors) && clerkErr.errors[0]?.message) {
        msg = clerkErr.errors[0].message;
      } else if (typeof clerkErr.message === "string") {
        msg = clerkErr.message;
      }
    }
    return { error: msg };
  }

  const now = new Date().toISOString();
  const { data: member, error: memberError } = await admin
    .from("company_members")
    .insert({
      company_id: companyId,
      clerk_user_id: clerkUserId,
      role: "employee",
      invited_at: now,
      joined_at: now,
    })
    .select("id")
    .single();

  if (memberError || !member) {
    await clerk.users.deleteUser(clerkUserId).catch(() => {});
    return { error: "Failed to register your membership. Please try again." };
  }

  await admin.from("employees").insert({
    company_id: companyId,
    clerk_user_id: clerkUserId,
    email_work: (invite.email_work as string | null) ?? null,
    email_personal: (invite.email_personal as string | null) ?? null,
  });

  const deptIds = ((invite.department_ids ?? []) as string[]);
  if (deptIds.length > 0) {
    await admin.from("employee_departments").insert(
      deptIds.map((department_id: string) => ({
        company_id: companyId,
        department_id,
        member_id: member.id,
      })),
    );
  }

  // Tombstone the invite
  await admin
    .from("employee_invites")
    .update({ claimed_at: now, claimed_by_clerk_user_id: clerkUserId })
    .eq("id", invite.id);

  const signInToken = await clerk.signInTokens.createSignInToken({
    userId: clerkUserId,
    expiresInSeconds: 3600,
  });

  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";
  const destination = `${proto}://${host}/sign-in?__clerk_ticket=${signInToken.token}&redirect_url=%2Fapp%2Fhome`;
  redirect(destination);
  return null;
}
