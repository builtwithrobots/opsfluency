'use client';

import { useState, useTransition } from 'react';
import {
  Award,
  CheckSquare,
  Factory,
  FileText,
  HeartPulse,
  List,
  ShieldCheck,
  Users,
} from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/components/ui/button';
import type { SopTemplate } from '@/lib/types/sop';
import { SOP_TEMPLATE } from '@/lib/types/sop';
import { updateIndustryPackages, updateActiveTemplates } from '../_actions';

// ── Industry package metadata ─────────────────────────────────────────────────

type IndustryPackage = 'general' | 'iso9001' | 'food-safety' | 'healthcare';

const PACKAGES: {
  key: IndustryPackage;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  departments: string[];
}[] = [
  {
    key: 'general',
    label: 'General',
    subtitle: 'Warehouse & Manufacturing',
    icon: Factory,
    departments: ['Safety', 'Equipment', 'Process', 'HR'],
  },
  {
    key: 'iso9001',
    label: 'ISO 9001',
    subtitle: 'Quality Management System',
    icon: Award,
    departments: ['Leadership', 'Planning', 'Operations', 'Quality Control', 'Support', 'HR'],
  },
  {
    key: 'food-safety',
    label: 'Food Safety',
    subtitle: 'HACCP / Food Production',
    icon: ShieldCheck,
    departments: ['Food Safety', 'Sanitation', 'Receiving & Storage', 'Production', 'Quality', 'HR'],
  },
  {
    key: 'healthcare',
    label: 'Healthcare',
    subtitle: 'Clinical & Patient Care',
    icon: HeartPulse,
    departments: ['Clinical Procedures', 'Infection Control', 'Compliance', 'Patient Safety', 'Equipment', 'HR'],
  },
];

// ── Content template metadata ─────────────────────────────────────────────────

const TEMPLATES: {
  key: SopTemplate;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  preview: string[];
}[] = [
  {
    key: 'step-by-step',
    label: 'Step-by-Step',
    description: 'Numbered steps with warning callouts. Best for procedures with a strict sequence.',
    icon: List,
    preview: ['1. Put on PPE', '2. Check pressure gauge', '⚠ Stop if reading exceeds 80 PSI'],
  },
  {
    key: 'reference',
    label: 'Reference',
    description: 'Section headers, sub-sections, and an auto-generated table of contents.',
    icon: FileText,
    preview: ['## Overview', '### Section 1', '### Section 2', '---'],
  },
  {
    key: 'safety-checklist',
    label: 'Safety Checklist',
    description: 'Checkbox list with hazard icons and prominent warnings. Best for daily safety checks.',
    icon: CheckSquare,
    preview: ['☐ Inspect fire extinguisher', '☐ Clear emergency exits', '🚨 Report issues immediately'],
  },
  {
    key: 'onboarding',
    label: 'Onboarding',
    description: 'Welcoming tone with section navigation and contact cards. Best for new-hire orientation.',
    icon: Users,
    preview: ['Welcome to the team!', '📋 Section nav', '👤 Your contact'],
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface SopTemplateTabClientProps {
  currentPackages: IndustryPackage[];
  activeTemplates: SopTemplate[];
  isAdmin: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SopTemplateTabClient({
  currentPackages,
  activeTemplates,
  isAdmin,
}: SopTemplateTabClientProps) {
  // ── Package state ──────────────────────────────────────────────────────────
  const [selectedPackages, setSelectedPackages] = useState<Set<IndustryPackage>>(
    new Set(currentPackages.length > 0 ? currentPackages : ['general']),
  );
  const [packagePending, startPackageTransition] = useTransition();
  const [packageFeedback, setPackageFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  // ── Active templates state ─────────────────────────────────────────────────
  const [enabled, setEnabled] = useState<Set<SopTemplate>>(new Set(activeTemplates));
  const [templatesPending, startTemplatesTransition] = useTransition();
  const [templatesFeedback, setTemplatesFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const isPending = packagePending || templatesPending;

  // ── Package handlers ───────────────────────────────────────────────────────

  function handleTogglePackage(key: IndustryPackage) {
    if (!isAdmin) return;
    setSelectedPackages((prev) => {
      if (prev.has(key) && prev.size === 1) return prev;
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleSavePackages() {
    startPackageTransition(async () => {
      const ordered = PACKAGES.map((p) => p.key).filter((k) => selectedPackages.has(k));
      const result = await updateIndustryPackages({ packages: ordered });
      setPackageFeedback(
        result.ok
          ? { ok: true, message: 'Industry packages saved.' }
          : { ok: false, message: 'Could not save packages. Please try again.' },
      );
      setTimeout(() => setPackageFeedback(null), 3000);
    });
  }

  // ── Template toggle handlers ───────────────────────────────────────────────

  function handleToggle(key: SopTemplate) {
    if (!isAdmin) return;
    setEnabled((prev) => {
      if (prev.has(key) && prev.size === 1) return prev;
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleSaveTemplates() {
    startTemplatesTransition(async () => {
      const ordered = SOP_TEMPLATE.filter((t) => enabled.has(t));
      const result = await updateActiveTemplates({ templates: ordered });
      setTemplatesFeedback(
        result.ok
          ? { ok: true, message: 'Available templates saved.' }
          : { ok: false, message: 'Could not save templates. Please try again.' },
      );
      setTimeout(() => setTemplatesFeedback(null), 3000);
    });
  }

  const hasUnsavedPackages =
    isAdmin &&
    (selectedPackages.size !== currentPackages.length ||
      PACKAGES.some((p) => selectedPackages.has(p.key) !== currentPackages.includes(p.key)));

  const hasUnsavedTemplates =
    isAdmin &&
    (enabled.size !== activeTemplates.length ||
      SOP_TEMPLATE.some((t) => enabled.has(t) !== activeTemplates.includes(t)));

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-10">

      {/* ── Section 1: Industry Packages ─────────────────────────────────── */}
      <section aria-labelledby="pkg-heading">
        <div className="mb-5">
          <h2 id="pkg-heading" className="text-base font-semibold text-dc-text">
            Industry Packages
          </h2>
          <p className="mt-1 text-sm text-dc-text-2">
            Select one or more packages that match your facility. Each package drives department
            structure suggestions and template recommendations when managers create new SOPs.
            {isAdmin && ' At least one must remain active.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PACKAGES.map((pkg) => {
            const isSelected = selectedPackages.has(pkg.key);
            const isLastSelected = isSelected && selectedPackages.size === 1;
            const Icon = pkg.icon;

            return (
              <button
                key={pkg.key}
                type="button"
                onClick={() => handleTogglePackage(pkg.key)}
                disabled={!isAdmin || isLastSelected}
                aria-pressed={isSelected}
                title={isLastSelected ? 'At least one package must remain active' : undefined}
                className={clsx(
                  'group relative flex flex-col gap-3 rounded-xl border p-5 text-left transition-all',
                  isSelected
                    ? 'border-(--color-brand) bg-(--color-brand)/5 shadow-sm'
                    : 'border-[color:var(--dc-edge)] bg-dc-surface opacity-50',
                  isAdmin && !isLastSelected && 'cursor-pointer hover:shadow-sm',
                  (!isAdmin || isLastSelected) && 'cursor-default',
                )}
              >
                {/* Active indicator */}
                <span
                  aria-hidden
                  className={clsx(
                    'absolute right-4 top-4 flex size-5 items-center justify-center rounded-full border-2 transition-colors',
                    isSelected
                      ? 'border-(--color-brand) bg-(--color-brand)'
                      : 'border-[color:var(--dc-edge-2)] bg-transparent',
                  )}
                >
                  {isSelected && (
                    <svg className="size-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>

                <div className="flex items-center gap-3">
                  <span className={clsx(
                    'flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                    isSelected ? 'bg-(--color-brand)/10 text-(--color-brand)' : 'bg-dc-raised text-dc-text-3',
                  )}>
                    <Icon className="size-5" strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className={clsx('font-semibold', isSelected ? 'text-dc-text' : 'text-dc-text-3')}>{pkg.label}</p>
                    <p className="text-xs text-dc-text-3">{pkg.subtitle}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {pkg.departments.map((d) => (
                    <span key={d} className="rounded-full bg-dc-raised px-2 py-0.5 text-xs text-dc-text-3">
                      {d}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {isAdmin ? (
          <div className="mt-5 flex items-center gap-4">
            <Button color="brand" onClick={handleSavePackages} disabled={isPending || !hasUnsavedPackages}>
              {packagePending ? 'Saving…' : 'Save industry packages'}
            </Button>
            {packageFeedback && (
              <p role="status" className={clsx('text-sm font-medium', packageFeedback.ok ? 'text-(--color-signal-ok)' : 'text-(--color-signal-urgent)')}>
                {packageFeedback.message}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-5 text-sm text-dc-text-3">
            Package settings can only be changed by an org admin.
          </p>
        )}
      </section>

      {/* Divider */}
      <hr className="border-[color:var(--dc-edge)]" />

      {/* ── Section 2: Available Templates ───────────────────────────────── */}
      <section aria-labelledby="tmpl-heading">
        <div className="mb-5">
          <h2 id="tmpl-heading" className="text-base font-semibold text-dc-text">
            Available Templates
          </h2>
          <p className="mt-1 text-sm text-dc-text-2">
            {isAdmin
              ? 'Choose which templates managers can use when creating SOPs. At least one must remain active.'
              : 'Templates available for new SOPs in your organisation.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TEMPLATES.map((t) => {
            const isActive = enabled.has(t.key);
            const isLastActive = isActive && enabled.size === 1;
            const Icon = t.icon;

            return (
              <button
                key={t.key}
                type="button"
                onClick={() => handleToggle(t.key)}
                disabled={!isAdmin || isLastActive}
                aria-pressed={isActive}
                title={isLastActive ? 'At least one template must remain active' : undefined}
                className={clsx(
                  'group relative flex flex-col gap-4 rounded-xl border p-5 text-left transition-all',
                  isActive
                    ? 'border-(--color-brand) bg-(--color-brand)/5 shadow-sm'
                    : 'border-[color:var(--dc-edge)] bg-dc-surface opacity-50',
                  isAdmin && !isLastActive && 'cursor-pointer hover:shadow-sm',
                  (!isAdmin || isLastActive) && 'cursor-default',
                )}
              >
                {/* Active indicator / toggle */}
                <span
                  aria-hidden
                  className={clsx(
                    'absolute right-4 top-4 flex size-5 items-center justify-center rounded-full border-2 transition-colors',
                    isActive
                      ? 'border-(--color-brand) bg-(--color-brand)'
                      : 'border-[color:var(--dc-edge-2)] bg-transparent',
                  )}
                >
                  {isActive && (
                    <svg className="size-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>

                <div className="flex items-center gap-3">
                  <span className={clsx(
                    'flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                    isActive ? 'bg-(--color-brand)/10 text-(--color-brand)' : 'bg-dc-raised text-dc-text-3',
                  )}>
                    <Icon className="size-5" strokeWidth={1.5} />
                  </span>
                  <span className={clsx('font-semibold', isActive ? 'text-dc-text' : 'text-dc-text-3')}>
                    {t.label}
                  </span>
                </div>

                <p className="text-sm leading-relaxed text-dc-text-2">{t.description}</p>

                <div className="rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2.5">
                  {t.preview.map((line, i) => (
                    <p key={i} className="truncate font-mono text-xs text-dc-text-3">{line}</p>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {isAdmin ? (
          <div className="mt-6 flex items-center gap-4">
            <Button color="brand" onClick={handleSaveTemplates} disabled={isPending || !hasUnsavedTemplates}>
              {templatesPending ? 'Saving…' : 'Save available templates'}
            </Button>
            {templatesFeedback && (
              <p role="status" className={clsx('text-sm font-medium', templatesFeedback.ok ? 'text-(--color-signal-ok)' : 'text-(--color-signal-urgent)')}>
                {templatesFeedback.message}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-6 text-sm text-dc-text-3">
            Template settings can only be changed by an org admin.
          </p>
        )}
      </section>
    </div>
  );
}
