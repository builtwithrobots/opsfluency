import { Plus } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createDepartment } from "@/app/dashboard/departments/_actions/departments";
import { ColorPickerClient } from "@/app/dashboard/departments/_components/color-picker-client";
import {
  DepartmentListClient,
  type DeptRow,
} from "@/app/dashboard/departments/_components/department-list-client";
import { DEPT_ICONS, ICON_KEYS } from "@/app/dashboard/departments/_lib/constants";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { getCompanyContext } from "@/lib/auth/company-context";

interface Props {
  editing?: string;
}

async function loadDepts(
  supabase: SupabaseClient,
  company_id: string,
): Promise<{ depts: DeptRow[]; countByDeptId: Record<string, number> }> {
  const { data, error } = await supabase
    .from("departments")
    .select("id, name, color_hex, icon_key, sort_order")
    .eq("company_id", company_id)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true }); // secondary tiebreaker
  if (error) throw error;

  const depts: DeptRow[] = (data ?? []).map((d) => ({
    id:         d.id,
    name:       d.name,
    color_hex:  d.color_hex ?? "#a1a1aa",
    icon_key:   d.icon_key  ?? "building-2",
    sort_order: d.sort_order ?? 0,
  }));

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
      {/* Department list — client component handles drag-to-reorder and inline editing */}
      <div>
        <Heading level={2} className="font-display text-xl">
          All departments
        </Heading>
        <DepartmentListClient
          depts={depts}
          countByDeptId={countByDeptId}
          initialEditingId={editing}
        />
      </div>

      {/* Create form */}
      <div className="overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
        <div className="border-b border-[color:var(--dc-edge)] px-5 py-4">
          <Heading level={2} className="font-display text-xl flex items-center gap-2">
            <Plus className="size-4 text-dc-text-3" strokeWidth={2} />
            New department
          </Heading>
          <Text className="mt-1 text-sm">
            Add a department and assign it a colour and icon.
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

          <ColorPickerClient defaultValue="#0ea5e9" />
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
