import { Pencil, Plus, Trash2, Users } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createDepartment,
  deleteDepartment,
  updateDepartment,
} from "@/app/dashboard/departments/_actions/departments";
import {
  DEPT_COLORS,
  DEPT_ICONS,
  ICON_KEYS,
  PALETTE_KEYS,
} from "@/app/dashboard/departments/_lib/constants";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getCompanyContext } from "@/lib/auth/company-context";

interface Props {
  editing?: string;
}

interface DeptRow {
  id: string;
  name: string;
  color_key: string;
  icon_key: string;
}

async function loadDepts(
  supabase: SupabaseClient,
  company_id: string,
): Promise<{ depts: DeptRow[]; countByDeptId: Record<string, number> }> {
  const { data, error } = await supabase
    .from("departments")
    .select("id, name, color_key, icon_key")
    .eq("company_id", company_id)
    .order("name", { ascending: true });
  if (error) throw error;

  const depts: DeptRow[] = data ?? [];
  if (!depts.length) return { depts, countByDeptId: {} };

  const deptIds = depts.map((d) => d.id);
  const { data: memberships } = await supabase
    .from("employee_departments")
    .select("department_id")
    .eq("company_id", company_id)
    .in("department_id", deptIds);

  const countByDeptId: Record<string, number> = {};
  for (const row of memberships ?? []) {
    countByDeptId[row.department_id] = (countByDeptId[row.department_id] ?? 0) + 1;
  }

  return { depts, countByDeptId };
}

const inputClass =
  "w-full rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-2 text-sm text-dc-text placeholder-dc-text-3 focus:border-(--color-brand) focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

const labelClass =
  "text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase";

function ColorPicker({ defaultValue }: { defaultValue: string }) {
  return (
    <fieldset>
      <legend className={`${labelClass} mb-2`}>Color</legend>
      <div className="flex flex-wrap gap-2">
        {PALETTE_KEYS.map((key) => {
          const { bg, label } = DEPT_COLORS[key];
          return (
            <label key={key} title={label} className="cursor-pointer">
              <input
                type="radio"
                name="color_key"
                value={key}
                defaultChecked={key === defaultValue}
                className="sr-only"
              />
              <span
                className={`block size-6 rounded-full ${bg} ring-offset-1 ring-offset-dc-surface checked-sibling:ring-2 checked-sibling:ring-(--color-brand) outline-2 outline-offset-1 has-[:checked]:outline has-[:checked]:outline-(--color-brand)`}
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function IconPicker({ defaultValue }: { defaultValue: string }) {
  return (
    <fieldset>
      <legend className={`${labelClass} mb-2`}>Icon</legend>
      <div className="flex flex-wrap gap-2">
        {ICON_KEYS.map((key) => {
          const { label, Icon } = DEPT_ICONS[key];
          return (
            <label key={key} title={label} className="cursor-pointer">
              <input
                type="radio"
                name="icon_key"
                value={key}
                defaultChecked={key === defaultValue}
                className="peer sr-only"
              />
              <span className="flex size-10 items-center justify-center rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised text-dc-text-3 peer-checked:border-(--color-brand) peer-checked:bg-(--color-brand)/10 peer-checked:text-(--color-brand) hover:bg-dc-overlay">
                <Icon className="size-4" strokeWidth={2} />
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export async function DepartmentsTab({ editing }: Props) {
  const { supabase, company_id } = await getCompanyContext("manager");
  const { depts, countByDeptId } = await loadDepts(supabase, company_id);

  return (
    <section className="flex flex-col gap-8 max-w-3xl">
      {/* Department list */}
      <div>
        <Heading level={2} className="font-display text-xl">
          All departments
        </Heading>

        {!depts.length ? (
          <div className="mt-4 rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-10 text-center">
            <p className="text-sm text-dc-text-2">No departments yet.</p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-[color:var(--dc-edge)] overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
            {depts.map((dept) => {
              const isHR = dept.name === "HR";
              const memberCount = countByDeptId[dept.id] ?? 0;
              const isEditing = editing === dept.id;
              const colorKey = dept.color_key in DEPT_COLORS ? dept.color_key as keyof typeof DEPT_COLORS : "zinc";
              const iconKey = dept.icon_key in DEPT_ICONS ? dept.icon_key : "building-2";
              const { bg } = DEPT_COLORS[colorKey];
              const { Icon } = DEPT_ICONS[iconKey];

              return (
                <li key={dept.id} className="flex flex-col">
                  {/* Row header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${bg}`}>
                        <Icon className="size-4 text-white" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-dc-text">{dept.name}</p>
                        {isHR ? (
                          <span className="rounded border border-teal-500/30 bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-teal-600 uppercase">
                            HR
                          </span>
                        ) : null}
                        <span className="flex items-center gap-1 rounded border border-[color:var(--dc-edge)] bg-dc-raised px-1.5 py-0.5 text-[10px] font-medium text-dc-text-3">
                          <Users className="size-2.5" strokeWidth={2} />
                          {memberCount}
                        </span>
                      </div>
                    </div>

                    {!isEditing ? (
                      <div className="flex shrink-0 items-center gap-2">
                        {!isHR ? (
                          <a
                            href={`/dashboard/departments?tab=departments&editing=${dept.id}`}
                            className="flex items-center gap-1.5 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-1.5 text-xs font-medium text-dc-text-2 hover:bg-dc-overlay hover:text-dc-text"
                          >
                            <Pencil className="size-3" strokeWidth={2} />
                            Edit
                          </a>
                        ) : null}
                        <form action={deleteDepartment}>
                          <input type="hidden" name="id" value={dept.id} />
                          <button
                            type="submit"
                            disabled={isHR || memberCount > 0}
                            title={
                              isHR
                                ? "HR cannot be deleted"
                                : memberCount > 0
                                  ? "Remove all members first"
                                  : undefined
                            }
                            className="flex items-center gap-1.5 rounded-md border border-(--color-signal-urgent)/30 bg-(--color-signal-urgent)/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-(--color-signal-urgent) uppercase hover:bg-(--color-signal-urgent)/20 disabled:pointer-events-none disabled:opacity-40"
                          >
                            <Trash2 className="size-3" strokeWidth={2} />
                            Delete
                          </button>
                        </form>
                      </div>
                    ) : (
                      <a
                        href="/dashboard/departments?tab=departments"
                        className="shrink-0 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-1.5 text-xs font-medium text-dc-text-2 hover:bg-dc-overlay hover:text-dc-text"
                      >
                        Cancel
                      </a>
                    )}
                  </div>

                  {/* Inline edit form */}
                  {isEditing ? (
                    <form
                      action={updateDepartment}
                      className="flex flex-col gap-5 border-t border-[color:var(--dc-edge)] bg-dc-raised/40 px-5 py-5"
                    >
                      <input type="hidden" name="id" value={dept.id} />

                      <label className="flex flex-col gap-1.5">
                        <span className={labelClass}>
                          Department name
                          <span className="ml-1 text-(--color-signal-urgent)">*</span>
                        </span>
                        <input
                          name="name"
                          type="text"
                          required
                          defaultValue={dept.name}
                          maxLength={80}
                          disabled={isHR}
                          className={inputClass}
                        />
                        {isHR ? (
                          <p className="text-xs text-dc-text-3">
                            The HR department cannot be renamed.
                          </p>
                        ) : null}
                      </label>

                      <ColorPicker defaultValue={dept.color_key} />
                      <IconPicker defaultValue={dept.icon_key} />

                      <div className="flex justify-end border-t border-[color:var(--dc-edge)] pt-4">
                        <button
                          type="submit"
                          className="rounded-md border border-(--color-brand)/30 bg-(--color-brand)/10 px-4 py-2 text-xs font-semibold tracking-wide text-(--color-brand) uppercase hover:bg-(--color-brand)/20"
                        >
                          Save changes
                        </button>
                      </div>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Create form */}
      <div className="overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
        <div className="border-b border-[color:var(--dc-edge)] px-5 py-4">
          <Heading level={2} className="font-display text-xl flex items-center gap-2">
            <Plus className="size-4 text-dc-text-3" strokeWidth={2} />
            New department
          </Heading>
          <Text className="mt-1 text-sm">
            Add a department and assign it a color and icon.
          </Text>
        </div>

        <form action={createDepartment} className="flex flex-col gap-5 px-5 py-5">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>
              Name
              <span className="ml-1 text-(--color-signal-urgent)">*</span>
            </span>
            <input
              name="name"
              type="text"
              required
              maxLength={80}
              placeholder="e.g. Receiving"
              className={inputClass}
            />
          </label>

          <ColorPicker defaultValue="sky" />
          <IconPicker defaultValue="building-2" />

          <div className="flex justify-end border-t border-[color:var(--dc-edge)] pt-4">
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-md border border-(--color-brand)/30 bg-(--color-brand)/10 px-4 py-2 text-xs font-semibold tracking-wide text-(--color-brand) uppercase hover:bg-(--color-brand)/20"
            >
              <Plus className="size-3.5" strokeWidth={2} />
              Create department
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
