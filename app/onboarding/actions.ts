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
  | {
      status: "error";
      code:
        | "UNAUTHENTICATED"
        | "ALREADY_MEMBER"
        | "INVALID_INPUT"
        | "BRIDGE_UNCONFIGURED"
        | "INTERNAL";
      message?: string;
      fieldErrors?: Record<string, string[]>;
    };

export async function createCompanyAction(
  _prev: CreateCompanyState,
  formData: FormData,
): Promise<CreateCompanyState> {
  try {
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

    // Best-effort double-submit defense. If the JWT bridge is down this
    // read returns null even when a row exists — which is fine here, the
    // bootstrap_company insert will then fail loudly on the unique
    // constraint and we translate that to BRIDGE_UNCONFIGURED below.
    const supabase = await getRequestClient();
    let existing: { company_id: string } | null = null;
    try {
      const { data } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("clerk_user_id", userId)
        .maybeSingle();
      existing = data ?? null;
    } catch {
      // Swallow — a failing read here is diagnosed post-bootstrap.
    }
    if (existing) return { status: "error", code: "ALREADY_MEMBER" };

    try {
      await bootstrapCompany({
        name: parsed.data.name,
        phone: parsed.data.phone ?? null,
        logoUrl: null,
        adminClerkUserId: userId,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      // A unique-constraint violation here means the row was written on a
      // previous attempt but the request-scoped read in the double-submit
      // defense above couldn't see it — classic "Clerk JWT isn't wired
      // into Supabase" symptom.
      if (/duplicate key|unique constraint/i.test(message)) {
        return { status: "error", code: "BRIDGE_UNCONFIGURED" };
      }
      return { status: "error", code: "INTERNAL", message };
    }

    // Post-bootstrap probe: read the row we just wrote, through the
    // JWT-authenticated client. If it's invisible, Clerk isn't registered
    // as a third-party auth provider in Supabase and the dashboard layout
    // will bounce the user straight back here — so stop the redirect and
    // surface the actionable error instead.
    try {
      const { data: readBack } = await supabase
        .from("company_members")
        .select("id")
        .eq("clerk_user_id", userId)
        .maybeSingle();
      if (!readBack) return { status: "error", code: "BRIDGE_UNCONFIGURED" };
    } catch {
      return { status: "error", code: "BRIDGE_UNCONFIGURED" };
    }

    revalidatePath("/dashboard");
  } catch (e) {
    // Last-resort safety net: any uncaught throw (missing env var, network
    // error, etc.) becomes a visible state instead of a silently-dead form.
    return {
      status: "error",
      code: "INTERNAL",
      message: e instanceof Error ? e.message : "Unknown error",
    };
  }

  // `redirect()` throws NEXT_REDIRECT internally; keep it outside the try
  // block so Next's router picks it up unimpeded.
  redirect("/dashboard?welcome=1");
}
