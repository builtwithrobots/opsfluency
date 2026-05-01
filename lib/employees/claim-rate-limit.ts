/**
 * In-memory sliding-window rate limiter for employee invite claim paths.
 *
 * Limit: MAX_ATTEMPTS per hashed IP per WINDOW_MS.
 * Applies to: phone-entry claim, personal-token claim, self-serve join request.
 *
 * This runs in the Next.js process — good enough for MVP. Replace with
 * an Upstash Redis-backed limiter when multi-instance deployment is needed.
 */

import { createHash } from "crypto";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const store = new Map<string, number[]>();

export function isClaimRateLimited(ipHash: string): boolean {
  const now = Date.now();
  const hits = (store.get(ipHash) ?? []).filter((t) => now - t < WINDOW_MS);

  if (hits.length >= MAX_ATTEMPTS) return true;

  hits.push(now);
  store.set(ipHash, hits);
  return false;
}

/** Hash an IP address to avoid storing PII in memory. */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}
