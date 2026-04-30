"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { bootstrapCompany } from "@/lib/auth/bootstrap-company";
import { getCompanyContext } from "@/lib/auth/company-context";
import { getAdminClient } from "@/lib/supabase/admin";
import { getRequestClient } from "@/lib/supabase/server";
import { createTeamInvite } from "@/app/dashboard/org-settings/_actions/team-invite";

// ── Step 1: create company (no redirect — wizard advances client-side) ────────

const CompanyInput = z.object({
  name: z.string().trim().min(1, "Company name is required").max(200),
  phone: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export type CreateCompanyWizardState =
  | { status: "idle" }
  | { status: "success"; company_id: string }
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

export async function createCompanyWizardAction(
  _prev: CreateCompanyWizardState,
  formData: FormData,
): Promise<CreateCompanyWizardState> {
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

    let company_id: string;
    try {
      const company = await bootstrapCompany({
        name: parsed.data.name,
        phone: parsed.data.phone ?? null,
        logoUrl: null,
        adminClerkUserId: userId,
      });
      company_id = company.id;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      if (/duplicate key|unique constraint/i.test(message)) {
        return { status: "error", code: "BRIDGE_UNCONFIGURED" };
      }
      return { status: "error", code: "INTERNAL", message };
    }

    // Post-bootstrap probe: verify the JWT bridge is working.
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

    return { status: "success", company_id };
  } catch (e) {
    return {
      status: "error",
      code: "INTERNAL",
      message: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

// ── Step 1 logo upload (called after company is created) ──────────────────────

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export type UploadLogoResult =
  | { ok: true; logoUrl: string }
  | { ok: false; error: string };

export async function uploadLogoAction(formData: FormData): Promise<UploadLogoResult> {
  try {
    const { company_id } = await getCompanyContext();

    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) return { ok: false, error: "No file provided." };
    if (!ALLOWED_MIME.has(file.type)) {
      return { ok: false, error: "Only JPEG, PNG, WebP, or GIF files are allowed." };
    }
    if (file.size > MAX_BYTES) {
      return { ok: false, error: "Logo must be under 2 MB." };
    }

    const ext = file.type.split("/")[1] ?? "png";
    const path = `${company_id}/logo.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const admin = getAdminClient();

    const { error: uploadError } = await admin.storage
      .from("company-logos")
      .upload(path, buffer, { contentType: file.type, upsert: true });
    if (uploadError) return { ok: false, error: uploadError.message };

    const { data: { publicUrl } } = admin.storage
      .from("company-logos")
      .getPublicUrl(path);

    await admin
      .from("companies")
      .update({ logo_url: publicUrl })
      .eq("id", company_id);

    return { ok: true, logoUrl: publicUrl };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed." };
  }
}

// ── Step 2: fetch departments ─────────────────────────────────────────────────

export interface OnboardingDepartment {
  id: string;
  name: string;
  color_hex: string;
  icon_key: string;
}

export type GetDepartmentsResult =
  | { ok: true; data: OnboardingDepartment[] }
  | { ok: false; error: string };

export async function getOnboardingDepartmentsAction(): Promise<GetDepartmentsResult> {
  try {
    const { supabase, company_id } = await getCompanyContext();
    const { data, error } = await supabase
      .from("departments")
      .select("id, name, color_hex, icon_key")
      .eq("company_id", company_id)
      .order("name", { ascending: true });

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data ?? []) as OnboardingDepartment[] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to load departments." };
  }
}

// ── Step 2: update a single department inline ─────────────────────────────────

const UpdateDeptSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  color_hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon_key: z.string().min(1),
});

export type UpdateDepartmentResult = { ok: true } | { ok: false; error: string };

export async function updateOnboardingDepartmentAction(
  input: unknown,
): Promise<UpdateDepartmentResult> {
  try {
    const { supabase, company_id } = await getCompanyContext();
    const parsed = UpdateDeptSchema.parse(input);

    // HR name is locked — preserve it silently rather than throwing.
    const { data: existing } = await supabase
      .from("departments")
      .select("name")
      .eq("id", parsed.id)
      .eq("company_id", company_id)
      .single();

    const finalName = existing?.name === "HR" ? "HR" : parsed.name;

    const { error } = await supabase
      .from("departments")
      .update({ name: finalName, color_hex: parsed.color_hex, icon_key: parsed.icon_key })
      .eq("id", parsed.id)
      .eq("company_id", company_id);
    if (error) return { ok: false, error: error.message };

    // Keep department-sourced label color in sync.
    await supabase
      .from("tags")
      .update({ color: parsed.color_hex })
      .eq("department_id", parsed.id)
      .eq("company_id", company_id)
      .eq("source", "department");

    return { ok: true };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, error: "Invalid input." };
    return { ok: false, error: e instanceof Error ? e.message : "Update failed." };
  }
}

// ── Step 3: send invite ───────────────────────────────────────────────────────

export type SendInviteResult =
  | { ok: true }
  | { ok: false; error: string };

export async function sendOnboardingInviteAction(formData: FormData): Promise<SendInviteResult> {
  const result = await createTeamInvite(formData);
  if (!result.ok) {
    return { ok: false, error: result.error.message ?? result.error.code };
  }
  return { ok: true };
}
