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
 * 70 = small, 160 = large. Stored as a number so it survives JSON round-trip.
 * Range: 70–160, step 10 — see DotSlider config in QRPrintEditor.
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
  show_company_name: boolean;       // independent of logo — both can be on
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

  /**
   * Per-band spacing in pixels — the gap between elements inside each band.
   * Range 0–60, step 5.
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
 * (a) the target-type's template default and (b) caller overrides — typically
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
  // Defaults mirror the original gap-2 / gap-5 / gap-1 Tailwind values.
  spacing_top:            8,
  spacing_middle:         20,
  spacing_footer:         4,
};

export const SPACING_SLIDER = { min: 0, max: 60, step: 5 } as const;

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
  'sop-standard':  'SOP — Standard',
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

/** Font size scale slider config — shared by every text-size DotSlider. */
export const FONT_SIZE_SLIDER = { min: 70, max: 160, step: 10 } as const;
