import type { Role } from '@/lib/auth/company-context';

/**
 * Per-QR audience filter. Each array is a positive include list — empty means
 * "no restriction on this axis." A scanner is allowed through if EITHER axis
 * matches (union), with two carve-outs handled in `passesAudience`:
 *   - both arrays empty → open to every member of the company
 *   - admins always pass regardless of audience
 *
 * The shape matches the two array columns on qr_codes (audience_department_ids,
 * audience_roles); store and read it as-is.
 */
export interface QrAudience {
  department_ids: string[];
  roles: Role[];
}

export const EMPTY_AUDIENCE: QrAudience = { department_ids: [], roles: [] };

export function isAudienceUnrestricted(audience: QrAudience): boolean {
  return audience.department_ids.length === 0 && audience.roles.length === 0;
}

interface ScannerContext {
  role: Role;
  department_ids: string[];
}

/**
 * Returns true if the scanner is allowed to view the QR's destination.
 * Admins always pass. Otherwise the scanner needs a matching role OR a
 * matching department, unless the audience is unrestricted.
 */
export function passesAudience(audience: QrAudience, scanner: ScannerContext): boolean {
  if (scanner.role === 'admin') return true;
  if (isAudienceUnrestricted(audience)) return true;

  const roleMatch = audience.roles.length > 0 && audience.roles.includes(scanner.role);
  if (roleMatch) return true;

  if (audience.department_ids.length > 0) {
    const set = new Set(audience.department_ids);
    return scanner.department_ids.some((id) => set.has(id));
  }
  return false;
}

/**
 * Scope of departments and roles a creator may target. Department managers
 * are constrained to their own departments and to assigning manager/employee
 * roles. Admins, super-admin impersonators, and HR managers (managers whose
 * department list includes "HR") get the unrestricted scope.
 */
export interface CreatorScope {
  unrestricted: boolean;
  allowed_department_ids: string[];   // ignored when unrestricted
  allowed_roles: Role[];              // ignored when unrestricted
}

export function isWithinCreatorScope(audience: QrAudience, scope: CreatorScope): boolean {
  if (scope.unrestricted) return true;

  const deptOk = audience.department_ids.every((id) => scope.allowed_department_ids.includes(id));
  if (!deptOk) return false;

  const roleOk = audience.roles.every((r) => scope.allowed_roles.includes(r));
  return roleOk;
}

/**
 * Per-QR mutation gate used by archive / restore / delete. Mirrors the
 * product rules:
 *   - admin or super-admin impersonator → any QR in the company
 *   - HR manager (creator scope is unrestricted) → any QR in the company
 *   - department manager → only QRs they themselves created
 *
 * The "everyone in the company" carve-out for an unrestricted scope means
 * the same helper covers both archive (move to archive) and delete (purge
 * from archive).
 */
export function canModifyQr(args: {
  qr: { created_by: string };
  userId: string;
  scope: CreatorScope;
}): boolean {
  if (args.scope.unrestricted) return true;
  return args.qr.created_by === args.userId;
}
