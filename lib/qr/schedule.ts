/**
 * QR scheduling — pure helpers for the active-window feature.
 *
 *   active_from  null → active from creation
 *   active_until null → never expires
 *   both null         → "no schedule" (default)
 *
 * A QR with archived_at set is always inactive regardless of its window.
 * SOP-typed QRs never carry a schedule (DB constraint backs this) and
 * always report `state: 'active'` and `schedule: 'none'` here.
 */

export interface QrScheduleColumns {
  archived_at:  string | null;
  active_from:  string | null;
  active_until: string | null;
}

export type ScheduleKind = 'none' | 'scheduled';
export type ScanState    = 'active' | 'inactive';

export interface QrStatus {
  /** Whether the QR is currently usable for scans. */
  state: ScanState;
  /** Whether a window has been configured at all. */
  schedule: ScheduleKind;
  /**
   * Reason the code is inactive — useful for messaging on the Gone page
   * and for the library's tooltips. `archived` covers manual archive;
   * `before` and `after` cover the schedule window.
   */
  reason?: 'archived' | 'before' | 'after';
}

/**
 * Computes the current status of a QR. `now` is injectable for testing
 * and for server components that already have a stable reference time.
 */
export function qrStatus(
  qr: QrScheduleColumns,
  now: Date = new Date(),
): QrStatus {
  const hasSchedule = !!(qr.active_from || qr.active_until);
  const schedule: ScheduleKind = hasSchedule ? 'scheduled' : 'none';

  if (qr.archived_at) return { state: 'inactive', schedule, reason: 'archived' };

  if (qr.active_from) {
    const start = new Date(qr.active_from);
    if (now < start) return { state: 'inactive', schedule, reason: 'before' };
  }
  if (qr.active_until) {
    const end = new Date(qr.active_until);
    if (now >= end) return { state: 'inactive', schedule, reason: 'after' };
  }

  return { state: 'active', schedule };
}

/**
 * Server-side validation for the create form. Returns null when the
 * input is acceptable, or an error code for the API to surface.
 */
export function validateScheduleInput(input: {
  active_from?: string | null;
  active_until?: string | null;
}): string | null {
  const start = input.active_from ? new Date(input.active_from) : null;
  const end   = input.active_until ? new Date(input.active_until) : null;

  if (start && Number.isNaN(start.getTime())) return 'invalid active_from';
  if (end && Number.isNaN(end.getTime()))     return 'invalid active_until';
  if (start && end && end <= start)            return 'active_until must be after active_from';

  return null;
}
