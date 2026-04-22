/**
 * In-memory sliding-window rate limiter for QR scan logging.
 *
 * Limit: MAX_SCANS per IP+QR pair per WINDOW_MS.
 * This runs in the Next.js process — good enough for MVP. Replace with
 * a Redis-backed limiter (e.g. @upstash/ratelimit) when usage warrants it.
 */

const MAX_SCANS  = 10;
const WINDOW_MS  = 60_000; // 1 minute

// key: `${ip_hash}:${qr_code_id}` → array of timestamps
const store = new Map<string, number[]>();

export function isRateLimited(ipHash: string, qrCodeId: string): boolean {
  const key  = `${ipHash}:${qrCodeId}`;
  const now  = Date.now();
  const hits = (store.get(key) ?? []).filter(t => now - t < WINDOW_MS);

  if (hits.length >= MAX_SCANS) return true;

  hits.push(now);
  store.set(key, hits);
  return false;
}
