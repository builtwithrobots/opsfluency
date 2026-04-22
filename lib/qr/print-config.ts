export type QrTargetType = 'sop' | 'announcement' | 'questionnaire' | 'url';

export type PrintTemplate =
  | 'sop-standard'    // numbered-steps icon, "Scan to view procedure"
  | 'announcement'    // megaphone icon, "Scan for latest update"
  | 'questionnaire'   // clipboard icon, "Scan to complete form"
  | 'generic';        // no icon, minimal

export interface PrintConfig {
  qr_size: number;        // 40–90 (% of 768pt container width), default 60
  header: string;
  sub_header: string;
  footer: string;
  footer2: string;        // default: company phone number
  show_logo: boolean;
  template: PrintTemplate;
}

const DEFAULT_TEMPLATE_BY_TYPE: Record<QrTargetType, PrintTemplate> = {
  sop:           'sop-standard',
  announcement:  'announcement',
  questionnaire: 'questionnaire',
  url:           'generic',
};

export function defaultPrintConfig(
  targetType: QrTargetType,
  overrides?: Partial<PrintConfig>
): PrintConfig {
  return {
    qr_size:    60,
    header:     '',
    sub_header: '',
    footer:     '',
    footer2:    '',
    show_logo:  true,
    template:   DEFAULT_TEMPLATE_BY_TYPE[targetType],
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
