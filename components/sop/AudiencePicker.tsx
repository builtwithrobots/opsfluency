'use client';

import type { Role } from '@/lib/auth/company-context';
import type { CreatorScope } from '@/lib/qr/audience';

export interface AudienceState {
  department_ids: string[];
  roles: Role[];
}

const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  { value: 'admin',    label: 'Admins',    description: 'Always allowed regardless of audience' },
  { value: 'manager',  label: 'Managers',  description: 'Department leads and supervisors' },
  { value: 'employee', label: 'Employees', description: 'Frontline workers' },
];

interface Props {
  /** All departments in the company. The creator scope filters which are pickable. */
  departments: { id: string; name: string }[];
  /** Server-resolved scope — admin / HR get the full set, others get their own depts. */
  scope: CreatorScope;
  value: AudienceState;
  onChange: (next: AudienceState) => void;
  /**
   * Optional explanatory copy below the heading. Defaults to the
   * doc-control-aware "pick at least one" prompt the upload form uses.
   */
  description?: string;
}

/**
 * Audience picker shared between the SOP upload modal and the per-SOP
 * Audience tab. Mirrors the QR audience UI: two columns of checkboxes
 * (departments + roles) plus a live summary line. The parent decides
 * whether the audience is allowed to be empty — this component just
 * renders the controls and reports state up.
 */
export function AudiencePicker({
  departments,
  scope,
  value,
  onChange,
  description,
}: Props) {
  const allowedRoleSet = new Set<Role>(
    scope.unrestricted ? ROLE_OPTIONS.map((r) => r.value) : scope.allowed_roles,
  );
  const visibleDepartments = scope.unrestricted
    ? departments
    : departments.filter((d) => scope.allowed_department_ids.includes(d.id));

  function toggleDept(id: string) {
    const has = value.department_ids.includes(id);
    onChange({
      ...value,
      department_ids: has ? value.department_ids.filter((x) => x !== id) : [...value.department_ids, id],
    });
  }
  function toggleRole(r: Role) {
    if (!allowedRoleSet.has(r)) return;
    const has = value.roles.includes(r);
    onChange({
      ...value,
      roles: has ? value.roles.filter((x) => x !== r) : [...value.roles, r],
    });
  }

  const summary = (() => {
    const depts = departments
      .filter((d) => value.department_ids.includes(d.id))
      .map((d) => d.name);
    const roles = value.roles.map((r) => ROLE_OPTIONS.find((o) => o.value === r)?.label ?? r);
    if (!depts.length && !roles.length) return 'No one yet — pick at least one department or role.';
    const parts: string[] = [];
    if (depts.length) parts.push(depts.join(', '));
    if (roles.length) parts.push(roles.join(', '));
    return parts.join(' · ');
  })();

  return (
    <fieldset className="flex flex-col gap-3 rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised/40 p-4">
      <div>
        <legend className="text-sm font-semibold text-dc-text">
          Who can see this SOP?
        </legend>
        <p className="mt-1 text-xs text-dc-text-3">
          {description ??
            'Pick at least one department or role. Admins and HR managers always see every SOP.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
                  <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm text-dc-text hover:bg-dc-surface">
                    <input
                      type="checkbox"
                      checked={value.department_ids.includes(d.id)}
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
              const allowed = allowedRoleSet.has(r.value);
              const checked = value.roles.includes(r.value);
              const isAdmin = r.value === 'admin';
              return (
                <li key={r.value}>
                  <label
                    className={
                      'flex cursor-pointer items-start gap-2 rounded-md px-2 py-1 text-sm hover:bg-dc-surface' +
                      (allowed ? ' text-dc-text' : ' cursor-not-allowed text-dc-text-3 opacity-60')
                    }
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!allowed}
                      onChange={() => toggleRole(r.value)}
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

      <p className="rounded-md bg-dc-surface px-3 py-2 text-xs text-dc-text-2">
        Audience: <span className="font-medium text-dc-text">{summary}</span>
      </p>
    </fieldset>
  );
}
