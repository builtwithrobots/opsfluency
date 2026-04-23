"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCompanyContext } from "@/lib/auth/company-context";
import { getAdminClient } from "@/lib/supabase/admin";

// Coerces empty strings → undefined so optional fields clear to null in DB.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

const UpdateCompanyInput = z.object({
  name:          z.string().trim().min(1, "Company name is required").max(200),
  address_line1: optionalText(200),
  address_line2: optionalText(200),
  city:          optionalText(100),
  state:         optionalText(50),
  zip:           optionalText(20),
  phone:         optionalText(50),
});

// ── Company profile (name + address + phone) ─────────────────────────────────

export async function updateCompanyProfile(formData: FormData): Promise<void> {
  // Admin client: companies UPDATE is not granted to authenticated role.
  // Caller is verified as org admin by getCompanyContext("admin").
  const { company_id } = await getCompanyContext("admin");

  const parsed = UpdateCompanyInput.parse({
    name:          formData.get("name"),
    address_line1: formData.get("address_line1"),
    address_line2: formData.get("address_line2"),
    city:          formData.get("city"),
    state:         formData.get("state"),
    zip:           formData.get("zip"),
    phone:         formData.get("phone"),
  });

  const admin = getAdminClient();
  const { error } = await admin
    .from("companies")
    .update({
      name:          parsed.name,
      address_line1: parsed.address_line1 ?? null,
      address_line2: parsed.address_line2 ?? null,
      city:          parsed.city          ?? null,
      state:         parsed.state         ?? null,
      zip:           parsed.zip           ?? null,
      phone:         parsed.phone         ?? null,
    })
    .eq("id", company_id);
  if (error) throw error;

  revalidatePath("/dashboard/org-settings");
  redirect("/dashboard/org-settings?tab=general&saved=1");
}

// ── Logo upload ───────────────────────────────────────────────────────────────

export async function uploadLogo(formData: FormData): Promise<void> {
  const { company_id } = await getCompanyContext("admin");

  const logoFile = formData.get("logo");
  if (!(logoFile instanceof File) || logoFile.size === 0) {
    redirect("/dashboard/org-settings?tab=general");
  }

  const admin = getAdminClient();
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

  // Cache-bust: the storage path never changes on re-upload, so we
  // append a timestamp so the browser always fetches fresh content.
  const logo_url = `${publicUrl}?v=${Date.now()}`;

  const { error } = await admin
    .from("companies")
    .update({ logo_url })
    .eq("id", company_id);
  if (error) throw error;

  revalidatePath("/dashboard/org-settings");
  redirect("/dashboard/org-settings?tab=general&saved=1");
}

// ── Logo removal ─────────────────────────────────────────────────────────────

export async function removeLogo(): Promise<void> {
  const { company_id } = await getCompanyContext("admin");
  const admin = getAdminClient();

  // Best-effort: don't throw if the file was already deleted.
  await admin.storage.from("company-logos").remove([`${company_id}/logo`]);

  const { error } = await admin
    .from("companies")
    .update({ logo_url: null })
    .eq("id", company_id);
  if (error) throw error;

  revalidatePath("/dashboard/org-settings");
  redirect("/dashboard/org-settings?tab=general&saved=1");
}
