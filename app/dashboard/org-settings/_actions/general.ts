"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCompanyContext } from "@/lib/auth/company-context";
import { getAdminClient } from "@/lib/supabase/admin";

const UpdateCompanyInput = z.object({
  name: z.string().trim().min(1, "Company name is required").max(200),
  phone: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export async function updateCompanyProfile(formData: FormData): Promise<void> {
  // Admin client needed to update `companies` — the table's RLS policy
  // only grants SELECT for tenant admins; the org admin is already
  // verified via getCompanyContext("admin") before we touch the DB.
  const { company_id } = await getCompanyContext("admin");

  const parsed = UpdateCompanyInput.parse({
    name: formData.get("name"),
    phone: formData.get("phone"),
  });

  const admin = getAdminClient();

  let logo_url: string | undefined;
  const logoFile = formData.get("logo");
  if (logoFile instanceof File && logoFile.size > 0) {
    const bytes = await logoFile.arrayBuffer();
    const { error: uploadError } = await admin.storage
      .from("company-logos")
      .upload(`${company_id}/logo`, bytes, {
        upsert: true,
        contentType: logoFile.type,
      });
    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = admin.storage.from("company-logos").getPublicUrl(`${company_id}/logo`);
    // Cache-bust: the storage path never changes (upsert), so append a
    // timestamp so the browser fetches fresh content after every upload.
    logo_url = `${publicUrl}?v=${Date.now()}`;
  }

  const update: Record<string, unknown> = {
    name: parsed.name,
    phone: parsed.phone ?? null,
  };
  if (logo_url) update.logo_url = logo_url;

  const { error } = await admin
    .from("companies")
    .update(update)
    .eq("id", company_id);
  if (error) throw error;

  revalidatePath("/dashboard/org-settings");
  redirect("/dashboard/org-settings?tab=general&saved=1");
}

export async function removeLogo(): Promise<void> {
  const { company_id } = await getCompanyContext("admin");
  const admin = getAdminClient();

  // Best-effort storage removal — if the file doesn't exist we still
  // clear the DB column so the UI is consistent.
  await admin.storage
    .from("company-logos")
    .remove([`${company_id}/logo`]);

  const { error } = await admin
    .from("companies")
    .update({ logo_url: null })
    .eq("id", company_id);
  if (error) throw error;

  revalidatePath("/dashboard/org-settings");
  redirect("/dashboard/org-settings?tab=general&saved=1");
}
