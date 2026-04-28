"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAdminClient } from "@/lib/supabase/admin";

export type ClaimTeamState = { error: string } | null;

export async function claimTeamInvite(
  _prev: ClaimTeamState,
  formData: FormData,
): Promise<ClaimTeamState> {
  const token = (formData.get("token") as string | null)?.trim();
  if (!token) return { error: "Invalid invite link." };

  const admin = getAdminClient();

  const { data: invite } = await admin
    .from("team_invites")
    .select("id, company_id, email, name, role, invited_at")
    .eq("token", token)
    .is("claimed_at", null)
    .maybeSingle();

  if (!invite) {
    return {
      error:
        "This invite has already been used or is no longer valid. Ask an admin to send a new one.",
    };
  }

  const clerk = await clerkClient();

  // Find or create the Clerk user — same pattern as employee claim.
  // If a user with this email already exists we reuse them; otherwise
  // we create a new account so the invitee never needs to sign up first.
  let clerkUserId: string;
  try {
    const existing = await clerk.users.getUserList({
      emailAddress: [invite.email],
    });

    if (existing.data.length > 0) {
      clerkUserId = existing.data[0].id;
    } else {
      const nameParts = (invite.name ?? "").split(" ").filter(Boolean);
      const user = await clerk.users.createUser({
        firstName: nameParts[0] ?? undefined,
        lastName: nameParts.slice(1).join(" ") || undefined,
        emailAddress: [invite.email],
        skipPasswordRequirement: true,
      });
      clerkUserId = user.id;
    }
  } catch (err: unknown) {
    let msg = "Failed to set up your account.";
    if (err && typeof err === "object") {
      const e = err as { errors?: { message: string }[]; message?: string };
      if (Array.isArray(e.errors) && e.errors[0]?.message) msg = e.errors[0].message;
      else if (typeof e.message === "string") msg = e.message;
    }
    return { error: msg };
  }

  // Guard: already a member of any company
  const { data: existing } = await admin
    .from("company_members")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  if (existing) {
    return {
      error:
        "This account is already linked to a company. Each account can belong to only one company.",
    };
  }

  const now = new Date().toISOString();

  const { error: insertErr } = await admin.from("company_members").insert({
    company_id: invite.company_id,
    clerk_user_id: clerkUserId,
    role: invite.role,
    invited_at: invite.invited_at,
    joined_at: now,
    is_owner: false,
  });

  if (insertErr) {
    return { error: "Failed to register membership. Please try again." };
  }

  // Tombstone
  await admin
    .from("team_invites")
    .update({ claimed_at: now, claimed_by_clerk_user_id: clerkUserId })
    .eq("id", invite.id);

  // Issue a Clerk sign-in token — invitee lands on dashboard already signed in
  const signInToken = await clerk.signInTokens.createSignInToken({
    userId: clerkUserId,
    expiresInSeconds: 3600,
  });

  const hdrs = await headers();
  const host =
    hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "localhost:3000";
  const proto =
    hdrs.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";

  redirect(
    `${proto}://${host}/sign-in?__clerk_ticket=${signInToken.token}&redirect_url=%2Fdashboard`,
  );
  return null;
}
