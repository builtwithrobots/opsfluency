import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const IMPERSONATION_COOKIE_NAME = "opsf_impersonation";

// Four hours. Long enough for a support session, short enough that a
// forgotten tab doesn't leave an open god-mode session overnight.
export const IMPERSONATION_TTL_SECONDS = 4 * 60 * 60;

export interface ImpersonationPayload {
  company_id: string;
  super_admin_clerk_user_id: string;
  iat: number;
}

function getSecret(): string {
  const secret = process.env.IMPERSONATION_COOKIE_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "IMPERSONATION_COOKIE_SECRET must be set to a 32+ character random string",
    );
  }
  return secret;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function fromB64url(s: string): Buffer {
  return Buffer.from(s, "base64url");
}

function sign(payload: ImpersonationPayload): string {
  const body = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const mac = createHmac("sha256", getSecret()).update(body).digest();
  return `${body}.${b64url(mac)}`;
}

function verify(token: string): ImpersonationPayload | null {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = createHmac("sha256", getSecret()).update(body).digest();
  const provided = fromB64url(sig);
  if (provided.length !== expected.length) return null;
  if (!timingSafeEqual(expected, provided)) return null;

  try {
    const parsed = JSON.parse(fromB64url(body).toString("utf8")) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof (parsed as ImpersonationPayload).company_id !== "string" ||
      typeof (parsed as ImpersonationPayload).super_admin_clerk_user_id !== "string" ||
      typeof (parsed as ImpersonationPayload).iat !== "number"
    ) {
      return null;
    }
    const payload = parsed as ImpersonationPayload;
    const ageSeconds = Math.floor(Date.now() / 1000) - payload.iat;
    if (ageSeconds < 0 || ageSeconds > IMPERSONATION_TTL_SECONDS) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Issues an HttpOnly, signed impersonation cookie for the given company.
 * The caller is responsible for verifying the current user is a super
 * admin before calling this — this helper blindly trusts its inputs.
 */
export async function setImpersonationCookie(
  companyId: string,
  superAdminClerkUserId: string,
): Promise<void> {
  const payload: ImpersonationPayload = {
    company_id: companyId,
    super_admin_clerk_user_id: superAdminClerkUserId,
    iat: Math.floor(Date.now() / 1000),
  };
  const jar = await cookies();
  jar.set(IMPERSONATION_COOKIE_NAME, sign(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: IMPERSONATION_TTL_SECONDS,
  });
}

export async function clearImpersonationCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(IMPERSONATION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Reads and verifies the impersonation cookie. Returns the payload if
 * the cookie is present, the signature matches, and the TTL hasn't
 * elapsed. Returns `null` in every other case — including a missing or
 * malformed cookie, so callers can use this as a "has an active
 * impersonation session" probe.
 *
 * This does NOT re-check super-admin status. The caller must also
 * verify the current Clerk user is still in `super_admins` before
 * trusting the payload — otherwise a revoked super admin's cookie
 * would keep working until it expired.
 */
export async function readImpersonationCookie(): Promise<ImpersonationPayload | null> {
  const jar = await cookies();
  const raw = jar.get(IMPERSONATION_COOKIE_NAME)?.value;
  if (!raw) return null;
  return verify(raw);
}
