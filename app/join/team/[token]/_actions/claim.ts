"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { getAdminClient } from "@/lib/supabase/admin";

export async function claimTeamInvite(token: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    redirect(`/sign-in?redirect_url=/join/team/${token}`);
  }

  const admin = getAdminClient();

  // Load and lock the invite in one atomic update so two concurrent
  // requests can't both claim the same token.
  const { data: invite, error: fetchErr } = await admin
    .from("team_invites")
    .select("id, company_id, role, invited_at")
    .eq("token", token)
    .is("claimed_at", null)
    .maybeSingle();

  if (fetchErr) throw fetchErr;
  if (!invite) {
    redirect(`/join/team/${token}?error=already_claimed`);
  }

  // Guard: already a member of ANY company — OpsFluency is single-tenant
  // per account (company context comes from company_members lookup).
  const { data: existing } = await admin
    .from("company_members")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (existing) {
    redirect(`/join/team/${token}?error=already_member`);
  }

  const now = new Date().toISOString();

  const { error: insertErr } = await admin.from("company_members").insert({
    company_id: invite.company_id,
    clerk_user_id: userId,
    role: invite.role,
    invited_at: invite.invited_at,
    joined_at: now,
    is_owner: false,
  });
  if (insertErr) throw insertErr;

  await admin
    .from("team_invites")
    .update({ claimed_at: now, claimed_by_clerk_user_id: userId })
    .eq("id", invite.id);

  redirect("/dashboard");
}
