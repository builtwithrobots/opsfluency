'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState, useTransition } from 'react';
import { FileUp, Plus, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
  SOP_UPLOAD_MAX_BYTES,
  SOP_UPLOAD_MIME_TYPES,
  type SopUploadMimeType,
} from '@/lib/types/sop';
import type { CreatorScope } from '@/lib/qr/audience';
import { AudiencePicker, type AudienceState } from '@/components/sop/AudiencePicker';
import { createSopFromUpload } from '../_actions';

interface Department {
  id: string;
  name: string;
}

interface Props {
  departments: Department[];
  /** Audience options the manager is allowed to assign. */
  scope: CreatorScope;
}

const ACCEPT_ATTR = SOP_UPLOAD_MIME_TYPES.join(',');

function deriveTitleFromFilename(filename: string): string {
  const noExt = filename.replace(/\.[^.]+$/, '');
  const cleaned = noExt.replace(/[_-]+/g, ' ').trim();
  if (!cleaned) return 'Untitled SOP';
  // Capitalize words for a sensible default the manager can edit.
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Unexpected reader result'));
        return;
      }
      // result = `data:<mime>;base64,<payload>`
      const idx = result.indexOf(',');
      resolve(idx === -1 ? result : result.slice(idx + 1));
    };
    reader.readAsDataURL(file);
  });
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadSopClient({ departments, scope }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [audience, setAudience] = useState<AudienceState>({ department_ids: [], roles: [] });
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ISO-grade doc control: manager must explicitly pick at least one
  // department or role. No silent "everyone in the company" fallback.
  const audienceChosen = audience.department_ids.length > 0 || audience.roles.length > 0;

  function reset() {
    setFile(null);
    setTitle('');
    setDepartmentId('');
    setAudience({ department_ids: [], roles: [] });
    setError(null);
    setDragOver(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleOpen() {
    reset();
    setOpen(true);
  }

  function validateAndAccept(f: File): boolean {
    if (!(SOP_UPLOAD_MIME_TYPES as readonly string[]).includes(f.type)) {
      setError('Unsupported file type. Use PDF, TXT, JPG, PNG, or HEIC.');
      return false;
    }
    if (f.size > SOP_UPLOAD_MAX_BYTES) {
      setError(`File is ${formatBytes(f.size)} — max is 10 MB.`);
      return false;
    }
    if (f.size === 0) {
      setError('That file is empty.');
      return false;
    }
    setError(null);
    setFile(f);
    if (!title.trim()) setTitle(deriveTitleFromFilename(f.name));
    return true;
  }

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) validateAndAccept(f);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [title],
  );

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) validateAndAccept(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;
    if (!departmentId) {
      setError('Pick a department before uploading.');
      return;
    }
    if (!audienceChosen) {
      setError('Pick at least one department or role for the audience — every SOP needs a defined audience.');
      return;
    }
    setError(null);

    let base64: string;
    try {
      base64 = await fileToBase64(file);
    } catch {
      setError('Could not read the file. Try again.');
      return;
    }

    startTransition(async () => {
      const result = await createSopFromUpload({
        title: title.trim(),
        department_id: departmentId,
        filename: file.name,
        mime_type: file.type as SopUploadMimeType,
        file_base64: base64,
        audience,
      });

      if (!result.ok) {
        setError(
          result.error.code === 'INVALID_INPUT'
            ? (result.error.message ?? 'Please check the file and try again.')
            : 'Could not create the SOP. Please try again.',
        );
        return;
      }

      setOpen(false);
      reset();
      router.push(`/dashboard/sops/${result.data.id}`);
    });
  }

  return (
    <>
      <Button color="brand" onClick={handleOpen}>
        <Plus data-slot="icon" strokeWidth={2} />
        Upload SOP
      </Button>

      <Dialog open={open} onClose={setOpen} size="lg">
        <form onSubmit={handleSubmit}>
          <div className="flex items-start justify-between">
            <DialogTitle>Upload a new SOP</DialogTitle>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-1 text-dc-text-3 hover:text-dc-text focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-brand)"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
          <DialogDescription>
            PDF, TXT, JPG, PNG, or HEIC up to 10 MB. One procedure per file works best — keep it under 10 pages for fastest results.
          </DialogDescription>

          <DialogBody className="flex flex-col gap-4">
            <label
              htmlFor="sop-upload-input"
              onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={[
                'flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
                dragOver
                  ? 'border-(--color-brand) bg-(--color-brand)/5'
                  : 'border-[color:var(--dc-edge)] bg-dc-raised hover:border-(--color-brand)',
              ].join(' ')}
            >
              <input
                ref={inputRef}
                id="sop-upload-input"
                type="file"
                accept={ACCEPT_ATTR}
                onChange={onPickFile}
                className="sr-only"
              />
              {file ? (
                <>
                  <FileUp className="size-7 text-(--color-brand)" strokeWidth={1.5} aria-hidden />
                  <p className="text-sm font-medium text-dc-text">{file.name}</p>
                  <p className="text-xs text-dc-text-3">{formatBytes(file.size)} · {file.type || 'unknown type'}</p>
                  <span className="mt-1 text-xs text-(--color-brand)">Click or drop to replace</span>
                </>
              ) : (
                <>
                  <Upload className="size-7 text-dc-text-3" strokeWidth={1.5} aria-hidden />
                  <p className="text-sm font-medium text-dc-text">Drop a file or click to browse</p>
                  <p className="text-xs text-dc-text-3">PDF · TXT · JPG · PNG · HEIC · max 10 MB · one procedure per file</p>
                </>
              )}
            </label>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="sop-title" className="text-sm font-medium text-dc-text">
                Title <span aria-hidden className="text-(--color-signal-urgent)">*</span>
              </label>
              <input
                id="sop-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
                placeholder="e.g. Forklift Pre-Shift Inspection"
                className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="sop-dept" className="text-sm font-medium text-dc-text">
                Department <span aria-hidden className="text-(--color-signal-urgent)">*</span>
              </label>
              {departments.length === 0 ? (
                <div
                  className="rounded-lg border border-dashed border-(--color-signal-warn) bg-(--color-signal-warn)/5 px-3 py-2 text-xs text-dc-text-2"
                  role="alert"
                >
                  Your org doesn&apos;t have any departments yet.{' '}
                  <a
                    href="/dashboard/departments"
                    className="font-medium text-(--color-brand) underline hover:no-underline"
                  >
                    Create one first
                  </a>
                  , then come back to upload.
                </div>
              ) : (
                <select
                  id="sop-dept"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  required
                  aria-invalid={!departmentId}
                  className="w-full rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none"
                >
                  <option value="" disabled>
                    Select a department…
                  </option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              )}
            </div>

            <AudiencePicker
              departments={departments}
              scope={scope}
              value={audience}
              onChange={setAudience}
              description="Document control: pick the departments and/or roles that should see this SOP. Admins and HR managers always see every SOP regardless."
            />

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-[color:var(--dc-edge)] bg-(--color-signal-urgent)/5 px-3 py-2 text-sm text-(--color-signal-urgent)"
              >
                {error}
              </p>
            )}
          </DialogBody>

          <DialogActions>
            <Button plain onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              color="brand"
              disabled={
                isPending ||
                !file ||
                !title.trim() ||
                !departmentId ||
                departments.length === 0 ||
                !audienceChosen
              }
            >
              {isPending ? 'Uploading…' : 'Upload & continue'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
