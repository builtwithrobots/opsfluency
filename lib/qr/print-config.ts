export type QrTargetType = 'sop' | 'announcement' | 'questionnaire' | 'url';

export type PrintTemplate =
  | 'sop-standard'    // numbered-steps icon, "Scan to view procedure"
  | 'announcement'    // megaphone icon, "Scan for latest update"
  | 'questionnaire'   // clipboard icon, "Scan to complete form"
  | 'generic';        // no icon, minimal

/**
 * Two font families are supported on the print sheet. Both are loaded by
 * next/font/google in app/layout.tsx and exposed as CSS variables.
 *   - 'sans'    → Inter         (CSS var --font-sans)
 *   - 'display' → Chakra Petch  (CSS var --font-display)
 */
export type PrintFontFamily = 'sans' | 'display';

/**
 * Font size scale, in percent of the element's baseline size. 100 = baseline,
 * 50 = half size, 150 = 1.5x. Stored as a number so it survives JSON round-trip.
 * Range: 50 to 150, step 10. Symmetric around 100 so the default sits at the
 * visual midpoint of the slider.
 */
export type FontScale = number;

export interface PrintConfig {
  qr_size: number;                  // 40–90 (% of 768pt container width), default 60
  /** Logo size scale (percent of 64px max-height baseline). */
  logo_size: FontScale;             // 50–150
  header: string;
  sub_header: string;
  footer: string;
  footer2: string;                  // default: company phone number
  /**
   * Tagline rendered below the QR. Defaulted to the target's template tagline
   * (TEMPLATE_TAGLINES). Empty string hides the line entirely.
   */
  tagline: string;
  show_logo: boolean;
  show_company_name: boolean;       // independent of logo - both can be on
  template: PrintTemplate;

  /** Font family applied to the whole sheet. */
  font_family: PrintFontFamily;

  /** Per-element size scale (percent of baseline). */
  font_size_company_name: FontScale;
  font_size_header:       FontScale;
  font_size_sub_header:   FontScale;
  font_size_tagline:      FontScale;
  font_size_footer:       FontScale;
  font_size_footer2:      FontScale;

  /** Per-element bold toggle. True renders the line in font-weight bold. */
  bold_company_name: boolean;
  bold_header:       boolean;
  bold_sub_header:   boolean;
  bold_tagline:      boolean;
  bold_footer:       boolean;
  bold_footer2:      boolean;

  /**
   * Per-band spacing in pixels, the gap between elements inside each band.
   * Range 0 to 60, step 5.
   *   spacing_top    → gap inside top band (logo ↔ company name)
   *   spacing_middle → gap inside middle band (header ↔ sub-header ↔ QR ↔ tagline)
   *   spacing_footer → gap inside footer band (footer ↔ footer2)
   */
  spacing_top:    number;
  spacing_middle: number;
  spacing_footer: number;
}

const DEFAULT_TEMPLATE_BY_TYPE: Record<QrTargetType, PrintTemplate> = {
  sop:           'sop-standard',
  announcement:  'announcement',
  questionnaire: 'questionnaire',
  url:           'generic',
};

/**
 * Hard-coded fallback config. `defaultPrintConfig` layers this with
 * (a) the target-type's template default and (b) caller overrides - typically
 * the company's `qr_design_defaults` from the Design Settings tab and the
 * footer2 phone number.
 */
export const BASE_PRINT_CONFIG: Omit<PrintConfig, 'template' | 'tagline'> = {
  qr_size:                60,
  logo_size:              100,
  header:                 '',
  sub_header:             '',
  footer:                 '',
  footer2:                '',
  show_logo:              true,
  show_company_name:      true,
  font_family:            'sans',
  font_size_company_name: 100,
  font_size_header:       100,
  font_size_sub_header:   100,
  font_size_tagline:      100,
  font_size_footer:       100,
  font_size_footer2:      100,
  // Bold defaults mirror what the preview was hard-coding before the
  // checkbox existed: company name and header bold, the rest regular.
  bold_company_name:      true,
  bold_header:            true,
  bold_sub_header:        false,
  bold_tagline:           false,
  bold_footer:            false,
  bold_footer2:           false,
  // Spacing defaults sit roughly mid-slider so users can tighten or loosen
  // each band by a meaningful amount in either direction.
  spacing_top:            16,
  spacing_middle:         20,
  spacing_footer:         12,
};

/** Slider config shared by every percentage-based size control. */
export const FONT_SIZE_SLIDER = { min: 50, max: 150, step: 10 } as const;

/** Logo size scale. Logo can only be enlarged from baseline, never shrunk. */
export const LOGO_SIZE_SLIDER = { min: 100, max: 200, step: 10 } as const;

/** Slider config for the QR Code Size control (% of sheet width). */
export const QR_SIZE_SLIDER = { min: 40, max: 80, step: 5 } as const;

/** Slider config shared by the three per-band spacing controls (px). */
export const SPACING_SLIDER = { min: 0, max: 40, step: 4 } as const;

/**
 * Subset of PrintConfig that is meaningful as an organisation-wide default.
 * Typography, sizing, visibility, spacing, and seed text content all belong
 * here. Target-derived fields (template) are excluded - tagline is excluded
 * too because it has a per-target default that admins haven't asked to
 * override yet.
 */
export const DESIGN_DEFAULT_KEYS = [
  'font_family',
  'show_logo',
  'show_company_name',
  'logo_size',
  'qr_size',
  // Seed text content that auto-fills every new QR. Per-QR edits override.
  'header',
  'sub_header',
  'footer',
  'footer2',
  'font_size_company_name',
  'font_size_header',
  'font_size_sub_header',
  'font_size_tagline',
  'font_size_footer',
  'font_size_footer2',
  'bold_company_name',
  'bold_header',
  'bold_sub_header',
  'bold_tagline',
  'bold_footer',
  'bold_footer2',
  'spacing_top',
  'spacing_middle',
  'spacing_footer',
] as const satisfies readonly (keyof PrintConfig)[];

export type DesignDefaultKey = (typeof DESIGN_DEFAULT_KEYS)[number];
export type DesignDefaults  = Partial<Pick<PrintConfig, DesignDefaultKey>>;

/** Project an arbitrary partial down to the design-default-safe subset. */
export function pickDesignDefaults(
  partial: Partial<PrintConfig> | null | undefined,
): DesignDefaults {
  if (!partial) return {};
  const out: DesignDefaults = {};
  for (const key of DESIGN_DEFAULT_KEYS) {
    if (key in partial && partial[key] !== undefined) {
      // Cast is safe: we copy each key into its own typed slot.
      (out as Record<string, unknown>)[key] = partial[key];
    }
  }
  return out;
}

export function defaultPrintConfig(
  targetType: QrTargetType,
  overrides?: Partial<PrintConfig>,
): PrintConfig {
  const template = overrides?.template ?? DEFAULT_TEMPLATE_BY_TYPE[targetType];
  return {
    ...BASE_PRINT_CONFIG,
    template,
    tagline: TEMPLATE_TAGLINES[template],
    ...overrides,
  };
}

export const TEMPLATE_LABELS: Record<PrintTemplate, string> = {
  'sop-standard':  'SOP - Standard',
  'announcement':  'Announcement',
  'questionnaire': 'Questionnaire',
  'generic':       'Generic',
};

export const TEMPLATE_TAGLINES: Record<PrintTemplate, string> = {
  'sop-standard':  'Scan to view procedure',
  'announcement':  'Scan for latest update',
  'questionnaire': 'Scan to complete form',
  'generic':       'Scan to view',
};

export const FONT_FAMILY_LABELS: Record<PrintFontFamily, string> = {
  sans:    'Sans (Inter)',
  display: 'Display (Chakra Petch)',
};

/** CSS font-family stack for each choice. Mirrors --font-* CSS variables. */
export const FONT_FAMILY_CSS: Record<PrintFontFamily, string> = {
  sans:    'var(--font-sans), Inter, system-ui, sans-serif',
  display: 'var(--font-display), "Chakra Petch", system-ui, sans-serif',
};
