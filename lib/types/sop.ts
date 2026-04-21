/**
 * SOP status lifecycle, content templates, and upload constraints.
 * Imported anywhere these values are referenced — never hardcode the
 * strings or the upload limits at call sites.
 */

export const SOP_STATUS = [
  "draft",
  "pending_terms",
  "pending_translation",
  "pending_approval",
  "published",
  "archived",
] as const;

export type SopStatus = (typeof SOP_STATUS)[number];

export const SOP_TEMPLATE = [
  "step-by-step",
  "reference",
  "safety-checklist",
  "onboarding",
] as const;

export type SopTemplate = (typeof SOP_TEMPLATE)[number];

/**
 * Allowed one-way transitions, mirroring the lifecycle documented in
 * `CLAUDE.md` → "SOP status lifecycle". Every Server Action that updates
 * `sops.status` reads the current status in the same transaction and
 * rejects any transition not listed here.
 */
export const ALLOWED_SOP_TRANSITIONS: Record<SopStatus, readonly SopStatus[]> = {
  draft: ["pending_terms"],
  pending_terms: ["pending_translation"],
  pending_translation: ["pending_approval"],
  pending_approval: ["published"],
  published: ["archived"],
  archived: [],
};

export function canTransitionSop(from: SopStatus, to: SopStatus): boolean {
  return ALLOWED_SOP_TRANSITIONS[from].includes(to);
}

export const SOP_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;

export type SopUploadMimeType = (typeof SOP_UPLOAD_MIME_TYPES)[number];

export const SOP_UPLOAD_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export const SOP_UPLOADS_BUCKET = "sop-uploads";
