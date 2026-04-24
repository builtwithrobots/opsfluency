'use client';

import { useState, useTransition } from 'react';
import {
  Award,
  CheckSquare,
  Factory,
  FileText,
  HeartPulse,
  List,
  Lock,
  ShieldCheck,
  Unlock,
  Users,
} from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import type { SopTemplate } from '@/lib/types/sop';
import { updateDefaultTemplate, updateIndustryPackage, setTemplateLock } from '../_actions';

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
    description: 'Section headers, sub-sections, and an auto-generated table of contents. Best for dense reference material.',
    icon: FileText,
    preview: ['## Overview', '### Section 1', '### Section 2', '---'],
  },
  {
    key: 'safety-checklist',
    label: 'Safety Checklist',
    description: 'Checkbox list with hazard icons and prominent warnings. Best for daily safety checks and audits.',
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
  currentPackage: IndustryPackage;
  currentTemplate: SopTemplate | null;
  templateLocked: boolean;
  isAdmin: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SopTemplateTabClient({
  currentPackage,
  currentTemplate,
  templateLocked,
  isAdmin,
}: SopTemplateTabClientProps) {
  // ── Package state ──────────────────────────────────────────────────────────
  const [selectedPackage, setSelectedPackage] = useState<IndustryPackage>(currentPackage);
  const [packagePending, startPackageTransition] = useTransition();
  const [packageFeedback, setPackageFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  // ── Template state ─────────────────────────────────────────────────────────
  const [selectedTemplate, setSelectedTemplate] = useState<SopTemplate>(currentTemplate ?? 'step-by-step');
  const [locked, setLocked] = useState(templateLocked);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [templatePending, startTemplateTransition] = useTransition();
  const [templateFeedback, setTemplateFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const isPending = packagePending || templatePending;

  // ── Package handlers ───────────────────────────────────────────────────────

  function handleSavePackage() {
    startPackageTransition(async () => {
      const result = await updateIndustryPackage({ package: selectedPackage });
      if (result.ok) {
        setPackageFeedback({ ok: true, message: 'Industry package saved.' });
      } else {
        setPackageFeedback({ ok: false, message: 'Could not save package. Please try again.' });
      }
      setTimeout(() => setPackageFeedback(null), 3000);
    });
  }

  // ── Template handlers ──────────────────────────────────────────────────────

  function handleSelectTemplate(key: SopTemplate) {
    if (locked || !isAdmin) return;
    setSelectedTemplate(key);
  }

  function handleSaveTemplate() {
    startTemplateTransition(async () => {
      const result = await updateDefaultTemplate({ template: selectedTemplate });
      if (result.ok) {
        setTemplateFeedback({ ok: true, message: 'Default template saved.' });
      } else {
        setTemplateFeedback({ ok: false, message: 'Could not save template. Please try again.' });
      }
      setTimeout(() => setTemplateFeedback(null), 3000);
    });
  }

  function handleLock() {
    startTemplateTransition(async () => {
      const result = await setTemplateLock(true);
      if (result.ok) {
        setLocked(true);
        setTemplateFeedback({ ok: true, message: 'Template locked.' });
      } else {
        setTemplateFeedback({ ok: false, message: 'Could not lock template.' });
      }
      setTimeout(() => setTemplateFeedback(null), 3000);
    });
  }

  function handleUnlock() {
    startTemplateTransition(async () => {
      const result = await setTemplateLock(false);
      if (result.ok) {
        setLocked(false);
        setUnlockDialogOpen(false);
        setTemplateFeedback({ ok: true, message: 'Template unlocked. Managers can now choose any template.' });
      } else {
        setTemplateFeedback({ ok: false, message: 'Could not unlock template.' });
      }
      setTimeout(() => setTemplateFeedback(null), 4000);
    });
  }

  const hasUnsavedPackage = isAdmin && selectedPackage !== currentPackage;
  const hasUnsavedTemplate = isAdmin && !locked && selectedTemplate !== (currentTemplate ?? 'step-by-step');

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-10">

      {/* ── Section 1: Industry Package ──────────────────────────────────── */}
      <section aria-labelledby="pkg-heading">
        <div className="mb-5">
          <h2 id="pkg-heading" className="text-base font-semibold text-dc-text">
            Industry Package
          </h2>
          <p className="mt-1 text-sm text-dc-text-2">
            Sets your org's department structure and drives template recommendations
            when managers create new SOPs. Changing this does not affect departments
            that already exist.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PACKAGES.map((pkg) => {
            const isSelected = selectedPackage === pkg.key;
            const Icon = pkg.icon;
            const isInteractive = isAdmin;

            return (
              <button
                key={pkg.key}
                type="button"
                onClick={() => isInteractive && setSelectedPackage(pkg.key)}
                disabled={!isInteractive}
                aria-pressed={isSelected}
                className={clsx(
                  'group relative flex flex-col gap-3 rounded-xl border p-5 text-left transition-all',
                  isSelected
                    ? 'border-(--color-brand) bg-(--color-brand)/5 shadow-sm ring-2 ring-(--color-brand)/20'
                    : 'border-[color:var(--dc-edge)] bg-dc-surface hover:border-(--color-brand)/40 hover:shadow-sm',
                  !isInteractive && 'cursor-default',
                )}
              >
                {/* Selected check */}
                {isSelected && (
                  <span className="absolute right-4 top-4 flex size-5 items-center justify-center rounded-full bg-(--color-brand) text-white">
                    <svg className="size-3" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}

                {/* Icon + labels */}
                <div className="flex items-center gap-3">
                  <span className={clsx(
                    'flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                    isSelected
                      ? 'bg-(--color-brand) text-white'
                      : 'bg-(--color-brand)/10 text-(--color-brand)',
                  )}>
                    <Icon className="size-5" strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className="font-semibold text-dc-text">{pkg.label}</p>
                    <p className="text-xs text-dc-text-3">{pkg.subtitle}</p>
                  </div>
                </div>

                {/* Department pills */}
                <div className="flex flex-wrap gap-1.5">
                  {pkg.departments.map((d) => (
                    <span
                      key={d}
                      className="rounded-full bg-dc-raised px-2 py-0.5 text-xs text-dc-text-3"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Package save row */}
        {isAdmin && (
          <div className="mt-5 flex items-center gap-4">
            <Button
              color="brand"
              onClick={handleSavePackage}
              disabled={isPending || !hasUnsavedPackage}
            >
              {packagePending ? 'Saving…' : 'Save industry package'}
            </Button>
            {packageFeedback && (
              <p
                className={clsx(
                  'text-sm font-medium',
                  packageFeedback.ok ? 'text-(--color-signal-ok)' : 'text-(--color-signal-urgent)',
                )}
                role="status"
              >
                {packageFeedback.message}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Divider */}
      <hr className="border-[color:var(--dc-edge)]" />

      {/* ── Section 2: Default Template Style ────────────────────────────── */}
      <section aria-labelledby="tmpl-heading">
        <div className="mb-5">
          <h2 id="tmpl-heading" className="text-base font-semibold text-dc-text">
            Default Template Style
          </h2>
          <p className="mt-1 text-sm text-dc-text-2">
            The structural layout applied to new SOPs by default. Lock it to enforce
            consistency across your team — only admins can unlock it.
          </p>
        </div>

        {/* Lock / unlock banner */}
        <div className={clsx(
          'mb-6 flex items-center justify-between gap-4 rounded-xl border px-5 py-4',
          locked
            ? 'border-(--color-signal-warn)/30 bg-(--color-signal-warn)/5'
            : 'border-[color:var(--dc-edge)] bg-dc-surface',
        )}>
          <div className="flex items-center gap-3">
            {locked
              ? <Lock className="size-5 shrink-0 text-(--color-signal-warn)" strokeWidth={1.5} />
              : <Unlock className="size-5 shrink-0 text-dc-text-3" strokeWidth={1.5} />
            }
            <div>
              <p className="text-sm font-semibold text-dc-text">
                {locked ? 'Template locked' : 'Template unlocked'}
              </p>
              <p className="mt-0.5 text-xs text-dc-text-3">
                {locked
                  ? 'All new SOPs must use the selected template. Only admins can change this.'
                  : 'Managers can choose any template when creating a SOP.'}
              </p>
            </div>
          </div>

          {isAdmin && (
            locked ? (
              <Button
                plain
                onClick={() => setUnlockDialogOpen(true)}
                disabled={isPending}
                className="shrink-0 text-sm text-(--color-signal-warn)"
              >
                <Unlock data-slot="icon" className="size-4" strokeWidth={2} />
                Unlock
              </Button>
            ) : (
              <Button
                color="brand"
                onClick={handleLock}
                disabled={isPending}
                className="shrink-0 text-sm"
              >
                <Lock data-slot="icon" className="size-4" strokeWidth={2} />
                Lock
              </Button>
            )
          )}
        </div>

        {/* Template grid */}
        <p className="mb-4 text-sm font-medium text-dc-text">
          {locked
            ? 'Active template (all new SOPs use this style)'
            : isAdmin
              ? 'Choose the default template for new SOPs'
              : 'Org default template (set by admin)'}
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TEMPLATES.map((t) => {
            const isSelected = selectedTemplate === t.key;
            const Icon = t.icon;
            const isInteractive = isAdmin && !locked;

            return (
              <button
                key={t.key}
                type="button"
                onClick={() => handleSelectTemplate(t.key)}
                disabled={!isInteractive}
                aria-pressed={isSelected}
                className={clsx(
                  'group relative flex flex-col gap-4 rounded-xl border p-5 text-left transition-all',
                  isSelected
                    ? 'border-(--color-brand) bg-(--color-brand)/5 shadow-sm ring-2 ring-(--color-brand)/20'
                    : 'border-[color:var(--dc-edge)] bg-dc-surface hover:border-(--color-brand)/40 hover:shadow-sm',
                  !isInteractive && 'cursor-default',
                )}
              >
                {isSelected && (
                  <span className="absolute right-4 top-4 flex size-5 items-center justify-center rounded-full bg-(--color-brand) text-white">
                    <svg className="size-3" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <span className={clsx(
                    'flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                    isSelected
                      ? 'bg-(--color-brand) text-white'
                      : 'bg-(--color-brand)/10 text-(--color-brand)',
                  )}>
                    <Icon className="size-5" strokeWidth={1.5} />
                  </span>
                  <span className="font-semibold text-dc-text">{t.label}</span>
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

        {/* Template save row */}
        {isAdmin ? (
          <div className="mt-6 flex items-center gap-4">
            <Button
              color="brand"
              onClick={handleSaveTemplate}
              disabled={isPending || locked || !hasUnsavedTemplate}
            >
              {templatePending ? 'Saving…' : 'Save default template'}
            </Button>
            {templateFeedback && (
              <p
                className={clsx(
                  'text-sm font-medium',
                  templateFeedback.ok ? 'text-(--color-signal-ok)' : 'text-(--color-signal-urgent)',
                )}
                role="status"
              >
                {templateFeedback.message}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-6 text-sm text-dc-text-3">
            Template settings can only be changed by an org admin.
          </p>
        )}
      </section>

      {/* Unlock confirmation dialog */}
      <Dialog open={unlockDialogOpen} onClose={setUnlockDialogOpen} size="sm">
        <DialogTitle>Unlock template?</DialogTitle>
        <DialogDescription>
          Unlocking lets managers pick any template when creating a SOP. SOPs already
          published will keep their current template — only new SOPs are affected.
        </DialogDescription>
        <DialogBody>
          <div className="rounded-lg border border-(--color-signal-warn)/30 bg-(--color-signal-warn)/5 p-4">
            <p className="text-sm font-medium text-(--color-signal-warn)">Formatting warning</p>
            <p className="mt-1 text-sm text-dc-text-2">
              Different templates produce different document structures. Mixing templates
              across SOPs in the same department can create inconsistent formatting for
              employees.
            </p>
          </div>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setUnlockDialogOpen(false)} disabled={isPending}>
            Keep locked
          </Button>
          <Button
            onClick={handleUnlock}
            disabled={isPending}
            className="bg-(--color-signal-warn) text-white hover:bg-(--color-signal-warn)/90"
          >
            {isPending ? 'Unlocking…' : 'Unlock anyway'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
