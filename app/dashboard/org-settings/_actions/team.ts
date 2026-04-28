"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCompanyContext } from "@/lib/auth/company-context";
import { getAdminClient } from "@/lib/supabase/admin";

const ChangeRoleInput = z.object({
  member_id: z.string().uuid(),
  new_role: z.enum(["admin", "manager"]),
});

const RemoveMemberInput = z.object({
  member_id: z.string().uuid(),
});

export async function changeMemberRole(formData: FormData): Promise<void> {
  // Auth check via RLS-enforced client; writes use admin client because
  // company_members has no UPDATE policy for the authenticated role.
  const { supabase, company_id, userId } = await getCompanyContext("admin");
  const admin = getAdminClient();

  const { member_id, new_role } = ChangeRoleInput.parse({
    member_id: formData.get("member_id"),
    new_role: formData.get("new_role"),
  });

  // Verify membership scoped to caller's company before bypassing RLS.
  const { data: target } = await supabase
    .from("company_members")
    .select("id, clerk_user_id, is_owner")
    .eq("id", member_id)
    .eq("company_id", company_id)
    .single();

  if (!target) throw new Error("Member not found");
  if (target.clerk_user_id === userId) throw new Error("Cannot change your own role");
  if (target.is_owner) throw new Error("Cannot change the org owner's role");

  const { error } = await admin
    .from("company_members")
    .update({ role: new_role })
    .eq("id", member_id)
    .eq("company_id", company_id);
  if (error) throw error;

  revalidatePath("/dashboard/org-settings");
}

export async function removeMember(formData: FormData): Promise<void> {
  // Auth check via RLS-enforced client; writes use admin client because
  // company_members has no DELETE policy for the authenticated role.
  const { supabase, company_id, userId } = await getCompanyContext("admin");
  const admin = getAdminClient();

  const { member_id } = RemoveMemberInput.parse({
    member_id: formData.get("member_id"),
  });

  // Verify membership scoped to caller's company before bypassing RLS.
  const { data: target } = await supabase
    .from("company_members")
    .select("id, clerk_user_id, is_owner")
    .eq("id", member_id)
    .eq("company_id", company_id)
    .single();

  if (!target) throw new Error("Member not found");
  if (target.clerk_user_id === userId) throw new Error("Cannot remove yourself");
  if (target.is_owner) throw new Error("Cannot remove the org owner");

  const { error } = await admin
    .from("company_members")
    .delete()
    .eq("id", member_id)
    .eq("company_id", company_id);
  if (error) throw error;

  revalidatePath("/dashboard/org-settings");
}
