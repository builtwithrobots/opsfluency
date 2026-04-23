"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCompanyContext } from "@/lib/auth/company-context";

const PALETTE = [
  "sky","emerald","amber","violet","rose","orange","teal","indigo","yellow","zinc",
] as const;

const ICONS = [
  "shield-check","wrench","users","clipboard-list",
  "zap","hard-hat","flask-conical","building-2",
] as const;

const CreateDeptInput = z.object({
  name:      z.string().trim().min(1).max(80),
  color_key: z.enum(PALETTE),
  icon_key:  z.enum(ICONS),
});

const UpdateDeptInput = z.object({
  id:        z.string().uuid(),
  name:      z.string().trim().min(1).max(80),
  color_key: z.enum(PALETTE),
  icon_key:  z.enum(ICONS),
});

const DeleteDeptInput = z.object({
  id: z.string().uuid(),
});

export async function createDepartment(formData: FormData): Promise<void> {
  const { supabase, company_id } = await getCompanyContext("manager");

  const parsed = CreateDeptInput.parse({
    name:      formData.get("name"),
    color_key: formData.get("color_key"),
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
    color_key: formData.get("color_key"),
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
    .update({ name: parsed.name, color_key: parsed.color_key, icon_key: parsed.icon_key })
    .eq("id", parsed.id)
    .eq("company_id", company_id);
  if (error) throw error;

  revalidatePath("/dashboard/departments");
  redirect("/dashboard/departments?tab=departments");
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
