import type { SopTemplate } from '@/lib/types/sop';

/**
 * Maps (industry_package, department name) → recommended SopTemplate.
 *
 * Keys are lower-cased at lookup time so "HR" and "hr" both match.
 * Any combination not listed here falls back to the caller-supplied
 * org default (usually `companies.default_sop_template`).
 */
const RECOMMENDATIONS: Record<string, Record<string, SopTemplate>> = {
  general: {
    safety:    'safety-checklist',
    equipment: 'step-by-step',
    process:   'step-by-step',
    hr:        'onboarding',
  },
  iso9001: {
    leadership:       'reference',
    planning:         'reference',
    operations:       'step-by-step',
    'quality control': 'safety-checklist',
    support:          'reference',
    hr:               'onboarding',
  },
  'food-safety': {
    'food safety':        'safety-checklist',
    sanitation:           'safety-checklist',
    'receiving & storage': 'step-by-step',
    production:           'step-by-step',
    quality:              'safety-checklist',
    hr:                   'onboarding',
  },
  healthcare: {
    'clinical procedures': 'step-by-step',
    'infection control':   'safety-checklist',
    compliance:            'reference',
    'patient safety':      'safety-checklist',
    equipment:             'step-by-step',
    hr:                    'onboarding',
  },
};

/**
 * Returns the recommended SopTemplate for a given industry package +
 * department name combination, or `fallback` when no mapping exists.
 *
 * Case-insensitive on both `industryPackage` and `departmentName`.
 */
export function getRecommendedTemplate(
  industryPackage: string,
  departmentName: string,
  fallback: SopTemplate,
): SopTemplate {
  const packageMap = RECOMMENDATIONS[industryPackage.toLowerCase()];
  if (!packageMap) return fallback;
  return packageMap[departmentName.toLowerCase()] ?? fallback;
}
