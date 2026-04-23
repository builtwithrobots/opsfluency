"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCompanyContext } from "@/lib/auth/company-context";

const AssignInput = z.object({
  department_id: z.string().uuid(),
  member_id:     z.string().uuid(),
});

const RemoveInput = z.object({
  department_id: z.string().uuid(),
  member_id:     z.string().uuid(),
});

export async function assignMemberToDepartment(formData: FormData): Promise<void> {
  const { supabase, company_id } = await getCompanyContext("manager");

  const parsed = AssignInput.parse({
    department_id: formData.get("department_id"),
    member_id:     formData.get("member_id"),
  });

  const { data: dept } = await supabase
    .from("departments")
    .select("id")
    .eq("id", parsed.department_id)
    .eq("company_id", company_id)
    .single();

  if (!dept) throw new Error("Department not found");

  const { error } = await supabase
    .from("employee_departments")
    .insert({ company_id, department_id: parsed.department_id, member_id: parsed.member_id });
  if (error) throw error;

  revalidatePath("/dashboard/departments");
}

export async function removeMemberFromDepartment(formData: FormData): Promise<void> {
  const { supabase, company_id } = await getCompanyContext("manager");

  const parsed = RemoveInput.parse({
    department_id: formData.get("department_id"),
    member_id:     formData.get("member_id"),
  });

  const { error } = await supabase
    .from("employee_departments")
    .delete()
    .eq("department_id", parsed.department_id)
    .eq("member_id", parsed.member_id)
    .eq("company_id", company_id);
  if (error) throw error;

  revalidatePath("/dashboard/departments");
}
