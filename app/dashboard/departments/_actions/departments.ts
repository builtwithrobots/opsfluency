"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCompanyContext } from "@/lib/auth/company-context";
import { ICON_KEYS } from "@/app/dashboard/departments/_lib/constants";

const HEX_COLOR = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a 6-digit hex colour");

const CreateDeptInput = z.object({
  name:      z.string().trim().min(1).max(80),
  color_hex: HEX_COLOR,
  icon_key:  z.string().refine((v) => ICON_KEYS.includes(v as never), "Unknown icon"),
});

const UpdateDeptInput = z.object({
  id:        z.string().uuid(),
  name:      z.string().trim().min(1).max(80),
  color_hex: HEX_COLOR,
  icon_key:  z.string().refine((v) => ICON_KEYS.includes(v as never), "Unknown icon"),
});

const DeleteDeptInput = z.object({
  id: z.string().uuid(),
});

const ReorderItem = z.object({
  id:         z.string().uuid(),
  sort_order: z.number().int().min(0),
});

export async function createDepartment(formData: FormData): Promise<void> {
  const { supabase, company_id } = await getCompanyContext("manager");

  const parsed = CreateDeptInput.parse({
    name:      formData.get("name"),
    color_hex: formData.get("color_hex"),
    icon_key:  formData.get("icon_key"),
  });

  const { error } = await supabase
    .from("departments")
    .insert({ company_id, ...parsed });
  if (error) throw error;

  revalidatePath("/dashboard/departments");
}

export async function updateDepartment(formData: FormData): Promise<void> {
  const { supabase, company_id } = await getCompanyContext("manager");

  const parsed = UpdateDeptInput.parse({
    id:        formData.get("id"),
    name:      formData.get("name"),
    color_hex: formData.get("color_hex"),
    icon_key:  formData.get("icon_key"),
  });

  const { data: existing } = await supabase
    .from("departments")
    .select("name")
    .eq("id", parsed.id)
    .eq("company_id", company_id)
    .single();

  if (!existing) throw new Error("Department not found");
  if (existing.name === "HR" && parsed.name !== "HR") {
    throw new Error("The HR department cannot be renamed");
  }

  const { error } = await supabase
    .from("departments")
    .update({ name: parsed.name, color_hex: parsed.color_hex, icon_key: parsed.icon_key })
    .eq("id", parsed.id)
    .eq("company_id", company_id);
  if (error) throw error;

  revalidatePath("/dashboard/departments");
  // No redirect — the client component closes the edit form after awaiting this action.
}

export async function deleteDepartment(formData: FormData): Promise<void> {
  const { supabase, company_id } = await getCompanyContext("manager");

  const { id } = DeleteDeptInput.parse({ id: formData.get("id") });

  const { data: existing } = await supabase
    .from("departments")
    .select("name")
    .eq("id", id)
    .eq("company_id", company_id)
    .single();

  if (!existing) throw new Error("Department not found");
  if (existing.name === "HR") throw new Error("The HR department cannot be deleted");

  const { count } = await supabase
    .from("employee_departments")
    .select("id", { count: "exact", head: true })
    .eq("department_id", id)
    .eq("company_id", company_id);

  if ((count ?? 0) > 0) {
    throw new Error("Remove all members from this department before deleting it");
  }

  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id);
  if (error) throw error;

  revalidatePath("/dashboard/departments");
}

export async function reorderDepartments(
  items: { id: string; sort_order: number }[],
): Promise<void> {
  const { supabase, company_id } = await getCompanyContext("manager");

  const parsed = z.array(ReorderItem).parse(items);

  // Update each row individually — the list is small (< 20 departments per company)
  // so N round-trips are acceptable and simpler than a raw SQL CASE WHEN.
  await Promise.all(
    parsed.map(({ id, sort_order }) =>
      supabase
        .from("departments")
        .update({ sort_order })
        .eq("id", id)
        .eq("company_id", company_id),
    ),
  );

  revalidatePath("/dashboard/departments");
}
