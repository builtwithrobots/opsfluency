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

/**
 * Returns the most-commonly recommended SopTemplate across all selected
 * industry packages for a given department. Ties resolve to the first match
 * found. Falls back when no package has a mapping for the department.
 */
export function getRecommendedTemplateForPackages(
  packages: string[],
  departmentName: string,
  fallback: SopTemplate,
): SopTemplate {
  if (packages.length === 0) return fallback;

  const counts = new Map<SopTemplate, number>();
  for (const pkg of packages) {
    const rec = getRecommendedTemplate(pkg, departmentName, fallback);
    // Only count explicit matches — ignore cases where the package returned
    // the fallback due to no mapping.
    const packageMap = RECOMMENDATIONS[pkg.toLowerCase()];
    const hasMapping = packageMap != null && packageMap[departmentName.toLowerCase()] != null;
    if (hasMapping) counts.set(rec, (counts.get(rec) ?? 0) + 1);
  }

  if (counts.size === 0) return fallback;

  let best = fallback;
  let bestCount = 0;
  for (const [t, count] of counts) {
    if (count > bestCount) { best = t; bestCount = count; }
  }
  return best;
}
