'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AudiencePicker, type AudienceState } from '@/components/sop/AudiencePicker';
import type { CreatorScope } from '@/lib/qr/audience';
import { updateSopAudience } from '../../_actions';

interface Props {
  sopId: string;
  departments: { id: string; name: string }[];
  scope: CreatorScope;
  initial: AudienceState;
}

/**
 * Per-SOP audience editor on /dashboard/sops/[id]?tab=audience. Same
 * dual-checkbox UI as the upload modal; same "must be non-empty" rule
 * (ISO doc control). Saves via the `updateSopAudience` Server Action,
 * which re-runs the creator-scope guard server-side.
 */
export function AudienceClient({ sopId, departments, scope, initial }: Props) {
  const router = useRouter();
  const [audience, setAudience] = useState<AudienceState>(initial);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dirty =
    audience.department_ids.length !== initial.department_ids.length ||
    audience.roles.length !== initial.roles.length ||
    audience.department_ids.some((id) => !initial.department_ids.includes(id)) ||
    audience.roles.some((r) => !initial.roles.includes(r));

  const audienceChosen = audience.department_ids.length > 0 || audience.roles.length > 0;

  function save() {
    if (!audienceChosen) {
      setError('Pick at least one department or role — every SOP needs a defined audience.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await updateSopAudience({ sop_id: sopId, audience });
      if (!r.ok) {
        setError(r.error.message ?? r.error.code);
        return;
      }
      setSavedAt(new Date());
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-5">
      <div>
        <h2 className="text-base font-semibold text-dc-text">Audience &amp; visibility</h2>
        <p className="mt-1 text-sm text-dc-text-3">
          Which workers can read this SOP — on the home feed, in search, and after they scan
          the QR. Admins and HR managers always see every SOP regardless of these settings.
        </p>
      </div>

      <AudiencePicker
        departments={departments}
        scope={scope}
        value={audience}
        onChange={setAudience}
      />

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[color:var(--dc-edge)] pt-4">
        {savedAt && !dirty && (
          <span className="text-xs text-dc-text-3">
            Saved {savedAt.toLocaleTimeString()}
          </span>
        )}
        {error && (
          <p className="mr-auto text-sm text-(--color-signal-urgent)" role="alert">
            {error}
          </p>
        )}
        <Button color="brand" onClick={save} disabled={!dirty || isPending || !audienceChosen}>
          <Save data-slot="icon" strokeWidth={2} />
          {isPending ? 'Saving…' : 'Save audience'}
        </Button>
      </div>
    </div>
  );
}
