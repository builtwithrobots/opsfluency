"use client";

/**
 * Thin wrappers around the Vibration API for the worker PWA. Workers in
 * gloves often miss visual feedback; a buzz from a phone in a chest pocket
 * is sometimes the only confirmation they get. Safari/iOS doesn't expose
 * `navigator.vibrate` — these calls are no-ops there, which is correct
 * (iOS handles haptics through native APIs we can't reach from a PWA).
 */

function vibrate(pattern: number | number[]): void {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw on unusual patterns. Silently ignore — haptics
    // are an enhancement, never a requirement.
  }
}

/** Light tap, e.g. selecting a value, toggling a chip. */
export function hapticTap(): void {
  vibrate(10);
}

/** Successful action, e.g. QR scan detected, form saved. */
export function hapticSuccess(): void {
  vibrate(20);
}

/** Destructive or attention-required, e.g. archive confirm, error toast. */
export function hapticWarn(): void {
  vibrate([40, 60, 40]);
}
