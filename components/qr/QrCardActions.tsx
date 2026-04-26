'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, RotateCcw, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/components/ui/dialog';

interface Props {
  qr_id: string;
  qr_label: string;
  archived: boolean;
  /** True when the caller can archive / restore / delete this QR. */
  canManage: boolean;
}

/**
 * Per-card action toolbar for the QR library. Active QRs get a single
 * Archive button; archived QRs get Restore + Delete (the latter behind a
 * confirmation dialog). Permission gating is computed server-side and
 * passed in as `canManage`; this component only owns the click handlers.
 */
export function QrCardActions({ qr_id, qr_label, archived, canManage }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<'archive' | 'restore' | 'delete' | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canManage) return null;

  async function archive() {
    setBusy('archive');
    setError(null);
    const res = await fetch(`/api/qr/${qr_id}/archive`, { method: 'POST' });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      setError(j?.error?.message ?? 'Could not archive');
      return;
    }
    router.refresh();
  }

  async function restore() {
    setBusy('restore');
    setError(null);
    const res = await fetch(`/api/qr/${qr_id}/restore`, { method: 'POST' });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      setError(j?.error?.message ?? 'Could not restore');
      return;
    }
    router.refresh();
  }

  async function reallyDelete() {
    setBusy('delete');
    setError(null);
    const res = await fetch(`/api/qr/${qr_id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
      const j = await res.json().catch(() => null);
      setBusy(null);
      setError(j?.error?.message ?? 'Could not delete');
      return;
    }
    setBusy(null);
    setConfirmOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {archived ? (
          <>
            <button
              type="button"
              onClick={restore}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-2.5 py-1 text-xs font-semibold text-dc-text-2 transition-colors hover:text-dc-text disabled:opacity-50"
            >
              <RotateCcw className="size-3.5" strokeWidth={2} aria-hidden />
              {busy === 'restore' ? 'Restoring…' : 'Restore'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 rounded-md border border-(--color-signal-urgent)/30 bg-(--color-signal-urgent)/5 px-2.5 py-1 text-xs font-semibold text-(--color-signal-urgent) transition-colors hover:bg-(--color-signal-urgent)/10 disabled:opacity-50"
            >
              <Trash2 className="size-3.5" strokeWidth={2} aria-hidden />
              Delete
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={archive}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-2.5 py-1 text-xs font-semibold text-dc-text-2 transition-colors hover:text-dc-text disabled:opacity-50"
          >
            <Archive className="size-3.5" strokeWidth={2} aria-hidden />
            {busy === 'archive' ? 'Archiving…' : 'Archive'}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-(--color-signal-urgent)" role="alert">{error}</p>
      )}

      <Dialog open={confirmOpen} onClose={() => !busy && setConfirmOpen(false)} size="md">
        <DialogTitle>Delete this QR code?</DialogTitle>
        <DialogDescription>
          {qr_label
            ? <>You&apos;re about to permanently delete <strong>{qr_label}</strong>.</>
            : <>You&apos;re about to permanently delete this QR code.</>}{' '}
          Anyone scanning the printed code will see a &ldquo;no longer
          available&rdquo; message. This can&apos;t be undone.
        </DialogDescription>
        <DialogBody>
          {error && (
            <p className="rounded-md border border-(--color-signal-urgent)/30 bg-(--color-signal-urgent)/5 px-3 py-2 text-xs text-(--color-signal-urgent)" role="alert">
              {error}
            </p>
          )}
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setConfirmOpen(false)} disabled={busy === 'delete'}>
            Cancel
          </Button>
          <Button color="red" onClick={reallyDelete} disabled={busy === 'delete'}>
            {busy === 'delete' ? 'Deleting…' : 'Delete forever'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
