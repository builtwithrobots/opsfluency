"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/employees/phone";

export type ClaimState = { error: string } | null;

export async function claimInvite(
  _prev: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const companyId = (formData.get("company_id") as string | null)?.trim();
  const rawPhone = (formData.get("phone") as string | null)?.trim() ?? "";

  if (!companyId) return { error: "Invalid claim link. Please scan the QR code again." };

  const phone = normalizePhone(rawPhone);
  if (!phone) {
    return { error: "Enter a valid US phone number, e.g. (555) 123-4567." };
  }

  const admin = getAdminClient();

  // Look up an unclaimed invite for this company + phone
  const { data: invite } = await admin
    .from("employee_invites")
    .select("id, phone, name, email_work, email_personal, department_ids")
    .eq("company_id", companyId)
    .eq("phone", phone)
    .is("claimed_at", null)
    .maybeSingle();

  if (!invite) {
    return {
      error:
        "We couldn't find an invite for that number. Double-check your number or ask your manager to add you.",
    };
  }

  const clerk = await clerkClient();

  // Create Clerk user. Phone is marked verified — the manager pre-approved it.
  // Personal email takes priority for magic-link re-logins; work email is a
  // fallback. If neither is set, the employee uses only the initial sign-in
  // token and can add an email later from their profile.
  const clerkEmail =
    (invite.email_personal as string | null) ??
    (invite.email_work as string | null) ??
    null;

  let clerkUserId: string;
  try {
    const nameParts = (invite.name ?? "").split(" ").filter(Boolean);
    const user = await clerk.users.createUser({
      firstName: nameParts[0] ?? undefined,
      lastName: nameParts.slice(1).join(" ") || undefined,
      ...(clerkEmail ? { emailAddress: [clerkEmail] } : {}),
      phoneNumber: [phone],
      skipPasswordRequirement: true,
    });
    clerkUserId = user.id;
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Failed to create your account.";
    return { error: `Account creation failed: ${msg}` };
  }

  // Create company_members row (employee, already joined)
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

  // Create employees extended profile with both email fields
  await admin.from("employees").insert({
    company_id: companyId,
    clerk_user_id: clerkUserId,
    phone,
    email_work: (invite.email_work as string | null) ?? null,
    email_personal: (invite.email_personal as string | null) ?? null,
  });

  // Assign departments from invite
  const deptIds = (invite.department_ids ?? []) as string[];
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
    .update({
      claimed_at: now,
      claimed_by_clerk_user_id: clerkUserId,
    })
    .eq("id", invite.id);

  // Issue a Clerk sign-in token — redirects the employee straight into the app
  const token = await clerk.signInTokens.createSignInToken({
    userId: clerkUserId,
    expiresInSeconds: 3600,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const destination = `${appUrl}/sign-in?__clerk_ticket=${token.token}&redirect_url=%2Fapp%2Fhome`;
  redirect(destination);
  // redirect() throws a NEXT_REDIRECT — unreachable, satisfies return type
  return null;
}
