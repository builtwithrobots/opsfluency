"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSuperAdminContext } from "@/lib/auth/super-admin-context";
import { getAdminClient } from "@/lib/supabase/admin";

/**
 * Add or remove rows from `super_admins`.
 *
 * Both entry points re-verify the caller is currently a super admin
 * via `getSuperAdminContext()`. The admin client is the only way to
 * write to `super_admins` — the table is REVOKE'd from anon /
 * authenticated, so every mutation necessarily bypasses RLS.
 *
 * Guard: a super admin cannot remove themselves. We never want to
 * produce an orphaned environment where no one can restore the role
 * without a direct SQL session.
 */

// Clerk user ids look like `user_<hash>` but the exact format isn't
// contractual — validate loosely, trim, and require non-empty.
const ClerkIdString = z
  .string()
  .trim()
  .min(1, "clerk_user_id is required")
  .max(200);

const AddInput = z.object({
  clerk_user_id: ClerkIdString,
  note: z.string().trim().max(500).optional(),
});

const RemoveInput = z.object({
  clerk_user_id: ClerkIdString,
});

export async function addSuperAdmin(formData: FormData): Promise<void> {
  await getSuperAdminContext();

  const rawNote = formData.get("note");
  const parsed = AddInput.parse({
    clerk_user_id: formData.get("clerk_user_id"),
    note: typeof rawNote === "string" && rawNote.length ? rawNote : undefined,
  });

  const admin = getAdminClient();
  const { error } = await admin
    .from("super_admins")
    .insert({
      clerk_user_id: parsed.clerk_user_id,
      note: parsed.note ?? null,
    });
  if (error) throw error;

  revalidatePath("/dashboard/platform");
}

export async function removeSuperAdmin(formData: FormData): Promise<void> {
  const { userId: currentSuperAdminId } = await getSuperAdminContext();

  const { clerk_user_id } = RemoveInput.parse({
    clerk_user_id: formData.get("clerk_user_id"),
  });

  if (clerk_user_id === currentSuperAdminId) {
    throw new Error("A super admin cannot remove themselves.");
  }

  const admin = getAdminClient();
  const { error } = await admin
    .from("super_admins")
    .delete()
    .eq("clerk_user_id", clerk_user_id);
  if (error) throw error;

  revalidatePath("/dashboard/platform");
}
