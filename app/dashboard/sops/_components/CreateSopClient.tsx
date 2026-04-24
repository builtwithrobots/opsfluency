'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { SOP_TEMPLATE, type SopTemplate } from '@/lib/types/sop';
import { createSop } from '../_actions';

const TEMPLATE_LABELS: Record<SopTemplate, string> = {
  'step-by-step': 'Step-by-Step',
  'reference': 'Reference',
  'safety-checklist': 'Safety Checklist',
  'onboarding': 'Onboarding',
};

interface Department {
  id: string;
  name: string;
}

interface CreateSopClientProps {
  departments: Department[];
  defaultTemplate: SopTemplate;
  templateLocked: boolean;
}

export function CreateSopClient({ departments, defaultTemplate, templateLocked }: CreateSopClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState<SopTemplate>(defaultTemplate);
  const [departmentId, setDepartmentId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  function handleOpen() {
    setTitle('');
    setTemplate(defaultTemplate);
    setDepartmentId('');
    setError(null);
    setOpen(true);
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
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none"
              >
                <option value="">No department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Template */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <label htmlFor="sop-template" className="text-sm font-medium text-dc-text">
                  Template
                </label>
                {templateLocked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-(--color-signal-warn)/15 px-2 py-0.5 text-xs font-medium text-(--color-signal-warn)">
                    Org-locked
                  </span>
                )}
              </div>
              <select
                id="sop-template"
                value={template}
                onChange={(e) => setTemplate(e.target.value as SopTemplate)}
                disabled={templateLocked}
                className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none disabled:opacity-50"
              >
                {SOP_TEMPLATE.map((t) => (
                  <option key={t} value={t}>{TEMPLATE_LABELS[t]}</option>
                ))}
              </select>
              {templateLocked && (
                <p className="text-xs text-dc-text-3">
                  Template is locked org-wide. Only admins can change it in the Template tab.
                </p>
              )}
            </div>

            {error && (
              <p className="rounded-lg border border-[color:var(--dc-edge)] bg-(--color-signal-urgent)/5 px-3 py-2 text-sm text-(--color-signal-urgent)">
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
