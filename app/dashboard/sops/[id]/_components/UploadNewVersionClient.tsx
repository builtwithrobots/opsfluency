'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState, useTransition } from 'react';
import { FileUp, Upload } from 'lucide-react';

import {
  SOP_UPLOAD_MAX_BYTES,
  SOP_UPLOAD_MIME_TYPES,
  type SopUploadMimeType,
} from '@/lib/types/sop';
import { uploadNewVersion } from '../../_actions';

const ACCEPT_ATTR = SOP_UPLOAD_MIME_TYPES.join(',');

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
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
      const idx = result.indexOf(',');
      resolve(idx === -1 ? result : result.slice(idx + 1));
    };
    reader.readAsDataURL(file);
  });
}

interface Props {
  sopId: string;
}

export function UploadNewVersionClient({ sopId }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const upload = useCallback(
    (f: File) => {
      if (!(SOP_UPLOAD_MIME_TYPES as readonly string[]).includes(f.type)) {
        setError('Unsupported file type. Use PDF, TXT, JPG, PNG, or HEIC.');
        return;
      }
      if (f.size > SOP_UPLOAD_MAX_BYTES) {
        setError(`File is ${formatBytes(f.size)} — max is 10 MB.`);
        return;
      }
      setError(null);

      startTransition(async () => {
        let base64: string;
        try {
          base64 = await fileToBase64(f);
        } catch {
          setError('Could not read the file.');
          return;
        }
        const r = await uploadNewVersion({
          sop_id: sopId,
          filename: f.name,
          mime_type: f.type as SopUploadMimeType,
          file_base64: base64,
        });
        if (!r.ok) {
          setError(r.error.message ?? r.error.code);
          return;
        }
        if (inputRef.current) inputRef.current.value = '';
        router.push(`/dashboard/sops/${sopId}`);
        router.refresh();
      });
    },
    [router, sopId],
  );

  return (
    <label
      htmlFor="new-version-input"
      onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) upload(f);
      }}
      className={[
        'flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-6 text-center transition-colors',
        dragOver
          ? 'border-(--color-brand) bg-(--color-brand)/5'
          : 'border-[color:var(--dc-edge)] bg-dc-surface hover:border-(--color-brand)',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        id="new-version-input"
        type="file"
        accept={ACCEPT_ATTR}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
        className="sr-only"
      />
      {isPending ? (
        <>
          <FileUp className="size-6 text-(--color-brand)" strokeWidth={1.5} aria-hidden />
          <p className="text-sm font-medium text-dc-text">Uploading new version…</p>
        </>
      ) : (
        <>
          <Upload className="size-6 text-dc-text-3" strokeWidth={1.5} aria-hidden />
          <p className="text-sm font-medium text-dc-text">Drop a file or click to upload a new version</p>
          <p className="text-xs text-dc-text-3">
            Status resets to draft. The current published version stays live until the new one is approved.
          </p>
        </>
      )}
      {error && (
        <p role="alert" className="text-xs text-(--color-signal-urgent)">
          {error}
        </p>
      )}
    </label>
  );
}
