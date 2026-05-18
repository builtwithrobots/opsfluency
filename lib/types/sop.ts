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
 * Document type discriminator. All types share the SOP pipeline; the type
 * drives AI prompt wording, suggested template defaults, and worker-side
 * labelling. `sop` is the default (and the value backfilled for every
 * pre-migration row).
 */
export const DOCUMENT_TYPES = [
  "sop",
  "policy",
  "training",
  "reference",
  "notice",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/**
 * Bilingual labels for each document type, per the
 * `opsfluency-bilingual-content` rule that every user-facing system string
 * exists in both EN and ES.
 */
export const DOCUMENT_TYPE_LABEL: Record<DocumentType, { en: string; es: string }> = {
  sop:       { en: "Procedure",  es: "Procedimiento" },
  policy:    { en: "Policy",     es: "Política"      },
  training:  { en: "Training",   es: "Capacitación"  },
  reference: { en: "Reference",  es: "Referencia"    },
  notice:    { en: "Notice",     es: "Aviso"         },
};

export function documentTypeLabel(type: DocumentType, lang: WorkerLanguage = "en"): string {
  return DOCUMENT_TYPE_LABEL[type][lang];
}

/**
 * Suggested display template for each document type. The upload form
 * pre-selects this; the manager can always override.
 */
export const SUGGESTED_TEMPLATE_BY_TYPE: Record<DocumentType, SopTemplate> = {
  sop:       "step-by-step",
  policy:    "reference",
  training:  "onboarding",
  reference: "reference",
  notice:    "step-by-step",
};

/**
 * Per-type accent color expressed as a CSS variable reference. Consumers
 * read `.var` and embed it as `var(${var})` so colors come from the
 * design tokens, not raw hex. Kept here so worker viewer, dashboard
 * detail, and any future surface classify a document the same way at a
 * glance.
 *
 *   sop       → brand teal (the default; this IS the product)
 *   policy    → signal-info blue (rules / written expectations)
 *   training  → signal-hub purple (learning / onboarding)
 *   reference → signal-neutral gray (lookup material)
 *   notice    → signal-warn amber (time-bound, requires attention)
 */
export const DOCUMENT_TYPE_ACCENT: Record<DocumentType, { var: `--${string}` }> = {
  sop:       { var: "--color-brand" },
  policy:    { var: "--color-signal-info" },
  training:  { var: "--color-signal-hub" },
  reference: { var: "--color-signal-neutral" },
  notice:    { var: "--color-signal-warn" },
};

/**
 * Filename-based heuristic for the upload form's initial type guess.
 * Cheap, deterministic, no AI call. The manager always sees the chip and
 * can override before the file goes to Sonnet. Order matters — first
 * matching rule wins so more-specific terms ("handbook", "onboarding")
 * beat generic ones.
 */
export function guessDocumentTypeFromFilename(filename: string): DocumentType {
  const f = filename.toLowerCase();
  if (/\b(onboarding|orientation|welcome|new[-_ ]?hire)\b/.test(f)) return "training";
  if (/\b(training|certification|certif|tutorial|course|guide)\b/.test(f)) return "training";
  if (/\b(handbook|policy|policies|code[-_ ]?of[-_ ]?conduct|hr)\b/.test(f)) return "policy";
  if (/\b(notice|alert|memo|bulletin|announcement)\b/.test(f)) return "notice";
  if (/\b(spec|specs|specification|reference|directory|contacts?|glossary)\b/.test(f)) return "reference";
  // Default: SOP. Matches today's behavior for every existing upload.
  return "sop";
}

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
