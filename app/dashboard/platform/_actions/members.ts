"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSuperAdminContext } from "@/lib/auth/super-admin-context";
import { getAdminClient } from "@/lib/supabase/admin";

// company_members rows are UUIDs; validate loosely.
const Input = z.object({
  member_id: z.string().uuid(),
  company_id: z.string().uuid(),
});

export async function lockMember(formData: FormData): Promise<void> {
  await getSuperAdminContext();

  const { member_id, company_id } = Input.parse({
    member_id: formData.get("member_id"),
    company_id: formData.get("company_id"),
  });

  const admin = getAdminClient();

  // Confirm the member belongs to the stated company before locking.
  const { data: row, error: fetchError } = await admin
    .from("company_members")
    .select("id, role")
    .eq("id", member_id)
    .eq("company_id", company_id)
    .single();
  if (fetchError || !row) throw new Error("Member not found in that company.");

  const { error } = await admin
    .from("company_members")
    .update({ locked_at: new Date().toISOString() })
    .eq("id", member_id);
  if (error) throw error;

  revalidatePath("/dashboard/platform");
}

export async function unlockMember(formData: FormData): Promise<void> {
  await getSuperAdminContext();

  const { member_id, company_id } = Input.parse({
    member_id: formData.get("member_id"),
    company_id: formData.get("company_id"),
  });

  const admin = getAdminClient();

  const { data: row, error: fetchError } = await admin
    .from("company_members")
    .select("id")
    .eq("id", member_id)
    .eq("company_id", company_id)
    .single();
  if (fetchError || !row) throw new Error("Member not found in that company.");

  const { error } = await admin
    .from("company_members")
    .update({ locked_at: null })
    .eq("id", member_id);
  if (error) throw error;

  revalidatePath("/dashboard/platform");
}
