'use client';

import { useState, useTransition } from 'react';
import { X } from 'lucide-react';

import {
  Dialog,
  DialogBody,
  DialogTitle,
  DialogActions,
} from '@/components/ui/dialog';
import { assignMemberDepartments } from '../_actions/team-invite';

interface Dept {
  id: string;
  name: string;
}

interface Props {
  memberId: string;
  memberName: string;
  currentDepartmentIds: string[];
  allDepartments: Dept[];
}

export function AssignDepartmentsModal({
  memberId,
  memberName,
  currentDepartmentIds,
  allDepartments,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(currentDepartmentIds),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleOpen() {
    setSelected(new Set(currentDepartmentIds));
    setError(null);
    setOpen(true);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await assignMemberDepartments(
        memberId,
        Array.from(selected),
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-1.5 text-xs font-medium text-dc-text-2 hover:bg-dc-overlay hover:text-dc-text"
      >
        Assign dept
      </button>

      <Dialog open={open} onClose={() => !isPending && setOpen(false)} size="sm">
        <div className="flex items-center justify-between">
          <DialogTitle>Assign departments</DialogTitle>
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={isPending}
            className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="size-4" />
          </button>
        </div>

        <DialogBody>
          <p className="mb-4 text-sm text-dc-text-2">
            Choose which departments{' '}
            <span className="font-medium text-dc-text">{memberName}</span> can
            manage. They can access the dashboard once at least one is assigned.
          </p>

          {allDepartments.length === 0 ? (
            <p className="text-sm text-dc-text-3">No departments found.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {allDepartments.map((dept) => (
                <label
                  key={dept.id}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm transition-colors ${
                    selected.has(dept.id)
                      ? 'border-(--color-brand)/50 bg-(--color-brand)/8 text-dc-text'
                      : 'border-[color:var(--dc-edge)] text-dc-text-2 hover:bg-dc-raised'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(dept.id)}
                    onChange={() => toggle(dept.id)}
                    disabled={isPending}
                    className="size-4 accent-(--color-brand)"
                  />
                  {dept.name}
                </label>
              ))}
            </div>
          )}

          {error && (
            <p className="mt-3 rounded-lg border border-(--color-signal-urgent)/30 bg-(--color-signal-urgent)/10 px-3 py-2 text-sm text-(--color-signal-urgent)">
              {error}
            </p>
          )}
        </DialogBody>

        <DialogActions>
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={isPending}
            className="rounded-lg border border-[color:var(--dc-edge)] px-4 py-2 text-sm text-dc-text-2 hover:bg-dc-overlay"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-(--color-brand) px-4 py-2 text-sm font-semibold text-white hover:bg-(--color-brand-hover) disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save'}
          </button>
        </DialogActions>
      </Dialog>
    </>
  );
}
