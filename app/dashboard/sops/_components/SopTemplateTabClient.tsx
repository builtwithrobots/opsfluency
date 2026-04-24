'use client';

import { useState, useTransition } from 'react';
import {
  CheckSquare,
  FileText,
  List,
  Lock,
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
import { updateDefaultTemplate, setTemplateLock } from '../_actions';

// ── Template metadata ─────────────────────────────────────────────────────────

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
  currentTemplate: SopTemplate | null;
  templateLocked: boolean;
  isAdmin: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SopTemplateTabClient({
  currentTemplate,
  templateLocked,
  isAdmin,
}: SopTemplateTabClientProps) {
  const [selected, setSelected] = useState<SopTemplate>(currentTemplate ?? 'step-by-step');
  const [locked, setLocked] = useState(templateLocked);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSelect(key: SopTemplate) {
    if (locked || !isAdmin) return;
    setSelected(key);
  }

  function handleSaveTemplate() {
    startTransition(async () => {
      const result = await updateDefaultTemplate({ template: selected });
      if (result.ok) {
        setFeedback({ ok: true, message: 'Default template saved.' });
      } else {
        setFeedback({ ok: false, message: 'Could not save template. Please try again.' });
      }
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  function handleLock() {
    startTransition(async () => {
      const result = await setTemplateLock(true);
      if (result.ok) {
        setLocked(true);
        setFeedback({ ok: true, message: 'Template locked.' });
      } else {
        setFeedback({ ok: false, message: 'Could not lock template.' });
      }
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  function handleUnlock() {
    startTransition(async () => {
      const result = await setTemplateLock(false);
      if (result.ok) {
        setLocked(false);
        setUnlockDialogOpen(false);
        setFeedback({ ok: true, message: 'Template unlocked. Managers can now choose any template.' });
      } else {
        setFeedback({ ok: false, message: 'Could not unlock template.' });
      }
      setTimeout(() => setFeedback(null), 4000);
    });
  }

  const hasUnsavedChange = isAdmin && !locked && selected !== (currentTemplate ?? 'step-by-step');

  return (
    <div className="flex flex-col gap-8">

      {/* Status banner */}
      <div className={clsx(
        'flex items-center justify-between gap-4 rounded-xl border px-5 py-4',
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
      <div>
        <p className="mb-4 text-sm font-medium text-dc-text">
          {locked
            ? 'Active template (all new SOPs use this style)'
            : isAdmin
              ? 'Choose the default template for new SOPs'
              : 'Org default template (set by admin)'}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TEMPLATES.map((t) => {
            const isSelected = selected === t.key;
            const Icon = t.icon;
            const isInteractive = isAdmin && !locked;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => handleSelect(t.key)}
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
                {/* Selected check */}
                {isSelected && (
                  <span className="absolute right-4 top-4 flex size-5 items-center justify-center rounded-full bg-(--color-brand) text-white">
                    <svg className="size-3" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}

                {/* Icon + label */}
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

                {/* Description */}
                <p className="text-sm leading-relaxed text-dc-text-2">{t.description}</p>

                {/* Mini preview */}
                <div className="rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2.5">
                  {t.preview.map((line, i) => (
                    <p key={i} className="truncate font-mono text-xs text-dc-text-3">{line}</p>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Save + feedback */}
      {isAdmin && (
        <div className="flex items-center gap-4">
          <Button
            color="brand"
            onClick={handleSaveTemplate}
            disabled={isPending || locked || !hasUnsavedChange}
          >
            {isPending ? 'Saving…' : 'Save default template'}
          </Button>

          {feedback && (
            <p className={clsx(
              'text-sm font-medium transition-opacity',
              feedback.ok ? 'text-(--color-signal-ok)' : 'text-(--color-signal-urgent)',
            )}>
              {feedback.message}
            </p>
          )}
        </div>
      )}

      {/* Non-admin read-only note */}
      {!isAdmin && (
        <p className="text-sm text-dc-text-3">
          Template settings can only be changed by an org admin.
        </p>
      )}

      {/* Unlock confirmation dialog */}
      <Dialog open={unlockDialogOpen} onClose={setUnlockDialogOpen} size="sm">
        <DialogTitle>Unlock template?</DialogTitle>
        <DialogDescription>
          Unlocking lets managers pick any template when creating a SOP. SOPs already published will
          keep their current template — only new SOPs are affected.
        </DialogDescription>
        <DialogBody>
          <div className="rounded-lg border border-(--color-signal-warn)/30 bg-(--color-signal-warn)/5 p-4">
            <p className="text-sm font-medium text-(--color-signal-warn)">Formatting warning</p>
            <p className="mt-1 text-sm text-dc-text-2">
              Different templates produce different document structures. Mixing templates across
              SOPs in the same department can create inconsistent formatting for employees.
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
