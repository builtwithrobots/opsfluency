'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Info, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { SopTemplate } from '@/lib/types/sop';
import { getRecommendedTemplateForPackages } from '@/lib/sop/template-recommendations';
import { createSop } from '../_actions';

const TEMPLATE_LABELS: Record<SopTemplate, string> = {
  'step-by-step':    'Step-by-Step',
  'reference':        'Reference',
  'safety-checklist': 'Safety Checklist',
  'onboarding':       'Onboarding',
};

interface Department {
  id: string;
  name: string;
}

interface CreateSopClientProps {
  departments: Department[];
  activeTemplates: SopTemplate[];
  industryPackages: string[];
}

export function CreateSopClient({
  departments,
  activeTemplates,
  industryPackages,
}: CreateSopClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  // Default to the first active template when the dialog opens.
  const [template, setTemplate] = useState<SopTemplate>(activeTemplates[0] ?? 'step-by-step');
  const [departmentId, setDepartmentId] = useState<string>('');
  // null  → no recommendation active
  // true  → recommendation is pre-filled and visible
  // false → manager manually overrode it
  const [recommendationActive, setRecommendationActive] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleOpen() {
    setTitle('');
    setTemplate(activeTemplates[0] ?? 'step-by-step');
    setDepartmentId('');
    setRecommendationActive(null);
    setError(null);
    setOpen(true);
  }

  function handleDepartmentChange(id: string) {
    setDepartmentId(id);

    if (!id) {
      setRecommendationActive(null);
      return;
    }

    const deptName = departments.find((d) => d.id === id)?.name ?? '';
    const fallback = activeTemplates[0] ?? 'step-by-step';
    const recommended = getRecommendedTemplateForPackages(industryPackages, deptName, fallback);

    // Only apply the recommendation if the recommended template is active.
    const effective = activeTemplates.includes(recommended) ? recommended : fallback;
    setTemplate(effective);
    setRecommendationActive(effective === recommended && deptName !== '');
  }

  function handleTemplateChange(value: SopTemplate) {
    setTemplate(value);
    // Manager explicitly changed — dismiss the recommendation hint.
    setRecommendationActive(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await createSop({
        title: title.trim(),
        template,
        department_id: departmentId || null,
      });

      if (!result.ok) {
        setError('Could not create SOP. Please try again.');
        return;
      }

      setOpen(false);
      router.push(`/dashboard/sops?tab=build`);
    });
  }

  return (
    <>
      <Button color="brand" onClick={handleOpen}>
        <Plus data-slot="icon" strokeWidth={2} />
        New SOP
      </Button>

      <Dialog open={open} onClose={setOpen} size="md">
        <form onSubmit={handleSubmit}>
          <div className="flex items-start justify-between">
            <DialogTitle>Create new SOP</DialogTitle>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-1 text-dc-text-3 hover:text-dc-text focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-brand)"
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          <DialogDescription>
            A draft SOP will be created. You can upload and convert content on the next screen.
          </DialogDescription>

          <DialogBody className="flex flex-col gap-4">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sop-title" className="text-sm font-medium text-dc-text">
                Title <span aria-hidden className="text-(--color-signal-urgent)">*</span>
              </label>
              <input
                id="sop-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Forklift Pre-Shift Inspection"
                maxLength={200}
                required
                className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
              />
            </div>

            {/* Department */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sop-dept" className="text-sm font-medium text-dc-text">
                Department
              </label>
              <select
                id="sop-dept"
                value={departmentId}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none"
              >
                <option value="">No department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Template — only active templates shown */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sop-template" className="text-sm font-medium text-dc-text">
                Template
              </label>
              <select
                id="sop-template"
                value={template}
                onChange={(e) => handleTemplateChange(e.target.value as SopTemplate)}
                className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none"
              >
                {activeTemplates.map((t) => (
                  <option key={t} value={t}>{TEMPLATE_LABELS[t]}</option>
                ))}
              </select>

              {recommendationActive === true && (
                <p
                  className="flex items-start gap-1.5 text-xs text-dc-text-2"
                  role="note"
                  aria-live="polite"
                >
                  <Info className="mt-px size-3.5 shrink-0 text-(--color-signal-info)" aria-hidden strokeWidth={2} />
                  Recommended for this department based on your industry packages
                </p>
              )}
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-[color:var(--dc-edge)] bg-(--color-signal-urgent)/5 px-3 py-2 text-sm text-(--color-signal-urgent)">
                {error}
              </p>
            )}
          </DialogBody>

          <DialogActions>
            <Button plain onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" color="brand" disabled={isPending || !title.trim()}>
              {isPending ? 'Creating…' : 'Create SOP'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
