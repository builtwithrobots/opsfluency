'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CalendarRange, ClipboardList, Lock, Globe } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { QrTargetType } from '@/lib/qr/print-config';
import type { CreatorScope } from '@/lib/qr/audience';
import type { Role } from '@/lib/auth/company-context';
import { DevicePreview } from '@/components/qr/DevicePreview';

type AvailableType = Exclude<QrTargetType, 'sop'>;

const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  { value: 'admin',    label: 'Admins',    description: 'Always allowed regardless of audience' },
  { value: 'manager',  label: 'Managers',  description: 'Department leads and supervisors' },
  { value: 'employee', label: 'Employees', description: 'Frontline workers' },
];

interface Props {
  departments: { id: string; name: string }[];
  scope: CreatorScope;
}

export default function NewQrForm({ departments, scope }: Props) {
  const router = useRouter();

  const [type,    setType]    = useState<AvailableType>('url');
  const [label,   setLabel]   = useState('');
  const [url,     setUrl]     = useState('');

  // For restricted creators we pre-populate the audience with their own
  // departments — otherwise an empty audience would silently mean "everyone
  // in the company," which they aren't allowed to do.
  const [deptIds, setDeptIds] = useState<string[]>(
    scope.unrestricted ? [] : scope.allowed_department_ids,
  );
  const [roles,   setRoles]   = useState<Role[]>([]);

  // Schedule. Off by default → QR is active indefinitely. When toggled
  // on, both inputs are required and `active_until` must come after
  // `active_from`. Values are local datetime strings (matches the
  // <input type="datetime-local"> contract); we convert to ISO at submit.
  const [scheduleOn, setScheduleOn] = useState(false);
  const [activeFromLocal,  setActiveFromLocal]  = useState('');
  const [activeUntilLocal, setActiveUntilLocal] = useState('');

  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const allowedRoleSet = useMemo(
    () => new Set(scope.unrestricted ? ROLE_OPTIONS.map((r) => r.value) : scope.allowed_roles),
    [scope],
  );

  const audience_summary = useMemo(() => {
    const depts = departments.filter((d) => deptIds.includes(d.id)).map((d) => d.name);
    const roleLabels = roles.map((r) => ROLE_OPTIONS.find((o) => o.value === r)?.label ?? r);
    if (depts.length === 0 && roleLabels.length === 0) return 'Everyone in the company';
    const parts: string[] = [];
    if (depts.length)      parts.push(depts.join(', '));
    if (roleLabels.length) parts.push(roleLabels.join(', '));
    return parts.join(' · ');
  }, [departments, deptIds, roles]);

  function toggleDept(id: string) {
    setDeptIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }
  function toggleRole(r: Role) {
    setRoles((cur) => (cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (type !== 'url') {
      setError('That target type isn\'t available on your plan yet.');
      return;
    }
    if (!url.trim()) {
      setError('Enter a destination URL.');
      return;
    }
    if (!scope.unrestricted && deptIds.length === 0 && roles.length === 0) {
      setError('Pick at least one department or role to target.');
      return;
    }

    let scheduleBody: { active_from: string | null; active_until: string | null } = {
      active_from: null,
      active_until: null,
    };
    if (scheduleOn) {
      if (!activeFromLocal || !activeUntilLocal) {
        setError('Pick a start and end for the schedule, or turn the schedule off.');
        return;
      }
      // datetime-local strings are interpreted in the user's local zone;
      // toISOString() emits UTC, which is what the server stores.
      const startIso = new Date(activeFromLocal).toISOString();
      const endIso   = new Date(activeUntilLocal).toISOString();
      if (new Date(endIso) <= new Date(startIso)) {
        setError('The end time must be after the start time.');
        return;
      }
      scheduleBody = { active_from: startIso, active_until: endIso };
    }

    setLoading(true);
    const res = await fetch('/api/qr', {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify({
        target_type: type,
        target_url:  url,
        label,
        audience: { department_ids: deptIds, roles },
        ...scheduleBody,
      }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json?.error?.message ?? 'Failed to create QR code');
      return;
    }
    router.push(`/dashboard/qr/${json.data.id}`);
  }

  const visibleDepartments = scope.unrestricted
    ? departments
    : departments.filter((d) => scope.allowed_department_ids.includes(d.id));

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-7">
        {/* Target type */}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-dc-text-2">Target type</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <TargetTile
              value="url"
              icon={<Globe className="size-5" strokeWidth={1.75} />}
              label="Custom URL"
              description="Link to any internal or external page."
              selected={type === 'url'}
              onSelect={() => setType('url')}
            />
            <TargetTile
              value="announcement"
              icon={<Bell className="size-5" strokeWidth={1.75} />}
              label="Announcement"
              description="Broadcast a message to selected teams."
              selected={false}
              onSelect={() => {}}
              locked
              lockedReason="Available on Pro"
            />
            <TargetTile
              value="questionnaire"
              icon={<ClipboardList className="size-5" strokeWidth={1.75} />}
              label="Survey"
              description="Collect structured feedback or a sign-off."
              selected={false}
              onSelect={() => {}}
              locked
              lockedReason="Available on Pro"
            />
          </div>
          <p className="mt-2 text-xs text-dc-text-3">
            SOP QR codes are now generated automatically when you publish an SOP — no need to
            create them here.
          </p>
        </fieldset>

        {/* Label */}
        <div>
          <label htmlFor="qr-label" className="mb-1 block text-sm font-medium text-dc-text-2">
            Label <span className="text-dc-text-3">(optional)</span>
          </label>
          <input
            id="qr-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={200}
            placeholder="e.g. Forklift Safety - Bay 3"
            className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
          />
        </div>

        {/* URL */}
        {type === 'url' && (
          <div>
            <label htmlFor="qr-url" className="mb-1 block text-sm font-medium text-dc-text-2">
              Destination URL{' '}
              <span className="text-(--color-signal-urgent)" aria-label="required">*</span>
            </label>
            <input
              id="qr-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="https://example.com/procedure"
              className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none"
            />
            <p className="mt-1 text-xs text-dc-text-3">
              Workers in the audience will be redirected here after they sign in.
            </p>
          </div>
        )}

        {/* Audience */}
        <fieldset className="flex flex-col gap-4 rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-5">
          <div>
            <legend className="text-sm font-semibold text-dc-text">Who can scan this?</legend>
            <p className="mt-1 text-xs text-dc-text-3">
              {scope.unrestricted
                ? 'Leave both lists empty to allow everyone in the company. Pick a department or role to scope it down.'
                : 'You can target your own department(s) and the roles below.'}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-dc-text-2 uppercase">
                Departments
              </p>
              {visibleDepartments.length === 0 ? (
                <p className="text-xs text-dc-text-3">No departments available.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {visibleDepartments.map((d) => (
                    <li key={d.id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm text-dc-text hover:bg-dc-raised">
                        <input
                          type="checkbox"
                          checked={deptIds.includes(d.id)}
                          onChange={() => toggleDept(d.id)}
                          className="size-4 rounded border-[color:var(--dc-edge)] text-(--color-brand) focus:ring-(--color-brand)"
                        />
                        <span>{d.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-medium tracking-wide text-dc-text-2 uppercase">
                Roles
              </p>
              <ul className="flex flex-col gap-1.5">
                {ROLE_OPTIONS.map((r) => {
                  const allowed  = allowedRoleSet.has(r.value);
                  const checked  = roles.includes(r.value);
                  const isAdmin  = r.value === 'admin';
                  return (
                    <li key={r.value}>
                      <label
                        className={
                          'flex cursor-pointer items-start gap-2 rounded-md px-2 py-1 text-sm hover:bg-dc-raised' +
                          (allowed ? ' text-dc-text' : ' cursor-not-allowed text-dc-text-3 opacity-60')
                        }
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!allowed}
                          onChange={() => allowed && toggleRole(r.value)}
                          className="mt-0.5 size-4 rounded border-[color:var(--dc-edge)] text-(--color-brand) focus:ring-(--color-brand)"
                        />
                        <span className="flex flex-col">
                          <span className="font-medium">{r.label}</span>
                          <span className="text-xs text-dc-text-3">
                            {isAdmin ? 'Always allowed regardless of audience' : r.description}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <p className="rounded-md bg-dc-raised px-3 py-2 text-xs text-dc-text-2">
            Audience: <span className="font-medium text-dc-text">{audience_summary}</span>
          </p>
        </fieldset>

        {/* Schedule */}
        <fieldset className="flex flex-col gap-4 rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <legend className="flex items-center gap-2 text-sm font-semibold text-dc-text">
                <CalendarRange className="size-4 text-(--color-brand)" strokeWidth={2} aria-hidden />
                Schedule
              </legend>
              <p className="mt-1 text-xs text-dc-text-3">
                Off by default — the QR is active indefinitely. Turn it on
                to limit when scans resolve. Outside the window, scans
                show the &ldquo;no longer available&rdquo; page.
              </p>
            </div>
            <label className="relative inline-flex shrink-0 cursor-pointer items-center">
              <input
                type="checkbox"
                checked={scheduleOn}
                onChange={(e) => setScheduleOn(e.target.checked)}
                className="peer sr-only"
              />
              <span className="h-6 w-11 rounded-full bg-dc-raised transition-colors peer-checked:bg-(--color-brand)" />
              <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
            </label>
          </div>

          {scheduleOn && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="qr-active-from" className="mb-1 block text-xs font-medium tracking-wide text-dc-text-2 uppercase">
                  Activate at
                </label>
                <input
                  id="qr-active-from"
                  type="datetime-local"
                  value={activeFromLocal}
                  onChange={(e) => setActiveFromLocal(e.target.value)}
                  required
                  className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="qr-active-until" className="mb-1 block text-xs font-medium tracking-wide text-dc-text-2 uppercase">
                  Deactivate at
                </label>
                <input
                  id="qr-active-until"
                  type="datetime-local"
                  value={activeUntilLocal}
                  onChange={(e) => setActiveUntilLocal(e.target.value)}
                  required
                  className="w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text focus:border-(--color-brand) focus:outline-none"
                />
              </div>
            </div>
          )}
        </fieldset>

        {error && (
          <p className="text-sm text-(--color-signal-urgent)" role="alert">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" color="brand" disabled={loading}>
            {loading ? 'Creating…' : 'Create QR code'}
          </Button>
          <Button href="/dashboard/qr" plain>
            Cancel
          </Button>
        </div>
      </form>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <DevicePreview label={label} url={url} audience_summary={audience_summary} />
      </aside>
    </div>
  );
}

interface TileProps {
  value: AvailableType;
  icon: React.ReactNode;
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  locked?: boolean;
  lockedReason?: string;
}

function TargetTile({
  value, icon, label, description, selected, onSelect, locked, lockedReason,
}: TileProps) {
  if (locked) {
    return (
      <div
        aria-disabled="true"
        className="relative flex cursor-not-allowed flex-col gap-2 rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface p-4 opacity-70"
      >
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-dc-raised px-2 py-0.5 text-[10px] font-medium tracking-wide text-dc-text-3 uppercase">
          <Lock className="size-3" strokeWidth={2} />
          {lockedReason ?? 'Locked'}
        </span>
        <span className="flex size-9 items-center justify-center rounded-lg bg-dc-raised text-dc-text-3">
          {icon}
        </span>
        <span className="text-sm font-semibold text-dc-text">{label}</span>
        <span className="text-xs text-dc-text-3">{description}</span>
      </div>
    );
  }
  return (
    <label
      className={
        'flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-colors ' +
        (selected
          ? 'border-(--color-brand) bg-(--color-brand)/10'
          : 'border-[color:var(--dc-edge)] hover:border-[color:var(--dc-edge-2)]')
      }
    >
      <input
        type="radio"
        name="target_type"
        value={value}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span className={
        'flex size-9 items-center justify-center rounded-lg ' +
        (selected
          ? 'bg-(--color-brand)/15 text-(--color-brand)'
          : 'bg-dc-raised text-dc-text-2')
      }>
        {icon}
      </span>
      <span className="text-sm font-semibold text-dc-text">{label}</span>
      <span className="text-xs text-dc-text-3">{description}</span>
    </label>
  );
}
