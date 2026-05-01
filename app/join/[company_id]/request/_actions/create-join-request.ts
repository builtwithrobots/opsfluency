"use server";

import { headers } from "next/headers";

import { getAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/employees/phone";
import { isClaimRateLimited, hashIp } from "@/lib/employees/claim-rate-limit";

export type JoinRequestState =
  | { status: "success" }
  | { status: "error"; message: string }
  | null;

export async function createJoinRequest(
  _prev: JoinRequestState,
  formData: FormData,
): Promise<JoinRequestState> {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown";
  if (isClaimRateLimited(hashIp(ip))) {
    // Rate limited — return success anyway to prevent enumeration
    return { status: "success" };
  }

  const companyId = (formData.get("company_id") as string | null)?.trim();
  if (!companyId) return { status: "error", message: "Invalid request." };

  const rawPhone = (formData.get("phone") as string | null)?.trim() ?? "";
  const phone = normalizePhone(rawPhone);
  if (!phone) {
    return { status: "error", message: "Enter a valid US phone number, e.g. (555) 123-4567." };
  }

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  if (!name) {
    return { status: "error", message: "Please enter your name." };
  }

  const emailPersonal = (formData.get("email_personal") as string | null)?.trim() || null;

  // Admin client justified: anon visitor (no Clerk session). Action does not
  // return any data about existing members — it always returns success.
  const admin = getAdminClient();

  // Verify the company exists before inserting
  const { data: company } = await admin
    .from("companies")
    .select("id")
    .eq("id", companyId)
    .maybeSingle();

  if (!company) {
    // Silent success — don't confirm whether company_id is valid
    return { status: "success" };
  }

  await admin
    .from("employee_join_requests")
    .insert({ company_id: companyId, phone, name, email_personal: emailPersonal })
    .select("id")
    // On duplicate pending request (23505), ignore — the constraint is
    // (company_id, phone, status='pending'). We return success either way
    // to avoid revealing that this phone already submitted a request.
    .maybeSingle();

  // Always return success — never reveal whether the phone is already in the
  // system, whether the company exists, or whether the insert succeeded.
  return { status: "success" };
}
