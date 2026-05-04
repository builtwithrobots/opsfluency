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
  // Translation auto-publishes — the manual approve gate was retired.
  // pending_approval is kept in the enum for legacy rows; promoting them
  // to published is still allowed so the migration path stays open.
  pending_translation: ["published"],
  pending_approval: ["published"],
  published: ["archived"],
  archived: [],
};

export function canTransitionSop(from: SopStatus, to: SopStatus): boolean {
  return ALLOWED_SOP_TRANSITIONS[from].includes(to);
}

/**
 * MIME types accepted by the SOP upload dropzone.
 * - PDF/images → Sonnet document/vision blocks
 * - TXT → utf-8 text path
 * - DOCX → mammoth text extraction → chunked text path
 * - DOC (legacy binary) → mammoth extraction attempt; falls back to text decode
 */
export const SOP_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/jpeg",
  "image/png",
  "image/heif",
] as const;

export type SopUploadMimeType = (typeof SOP_UPLOAD_MIME_TYPES)[number];

export function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

export function isPdfMime(mime: string): boolean {
  return mime === "application/pdf";
}

export function isWordMime(mime: string): boolean {
  return (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/msword"
  );
}

export const SOP_UPLOAD_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export const SOP_UPLOADS_BUCKET = "sop-uploads";

export const WORKER_LANGUAGES = ["en", "es"] as const;
export type WorkerLanguage = (typeof WORKER_LANGUAGES)[number];
