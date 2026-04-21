"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { bootstrapCompany } from "@/lib/auth/bootstrap-company";
import { getRequestClient } from "@/lib/supabase/server";

const CompanyInput = z.object({
  name: z.string().trim().min(1, "Company name is required").max(200),
  phone: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export type CreateCompanyState =
  | { status: "idle" }
  | { status: "error"; code: "UNAUTHENTICATED" | "ALREADY_MEMBER" | "INVALID_INPUT" | "INTERNAL"; message?: string; fieldErrors?: Record<string, string[]> };

export async function createCompanyAction(
  _prev: CreateCompanyState,
  formData: FormData,
): Promise<CreateCompanyState> {
  const { userId } = await auth();
  if (!userId) return { status: "error", code: "UNAUTHENTICATED" };

  const parsed = CompanyInput.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      code: "INVALID_INPUT",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Defensive: block double-submit. The user's request-scoped client can
  // only see rows RLS lets them see, so this lookup correctly returns null
  // for a fresh signup and the existing row for anyone already onboarded.
  const supabase = await getRequestClient();
  const { data: existing } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (existing) return { status: "error", code: "ALREADY_MEMBER" };

  try {
    await bootstrapCompany({
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      logoUrl: null,
      adminClerkUserId: userId,
    });
  } catch (e) {
    return {
      status: "error",
      code: "INTERNAL",
      message: e instanceof Error ? e.message : "Unknown error",
    };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?welcome=1");
}
