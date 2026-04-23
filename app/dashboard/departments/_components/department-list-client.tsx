"use client";

import { useState, useTransition } from "react";
import { GripVertical, Pencil, Trash2, Users } from "lucide-react";

import {
  deleteDepartment,
  reorderDepartments,
  updateDepartment,
} from "@/app/dashboard/departments/_actions/departments";
import { DEPT_ICONS, ICON_KEYS } from "@/app/dashboard/departments/_lib/constants";
import { ColorPickerClient } from "@/app/dashboard/departments/_components/color-picker-client";

export interface DeptRow {
  id: string;
  name: string;
  color_hex: string;
  icon_key: string;
  sort_order: number;
}

interface Props {
  depts: DeptRow[];
  countByDeptId: Record<string, number>;
  initialEditingId?: string;
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

export function DepartmentListClient({ depts: initialDepts, countByDeptId, initialEditingId }: Props) {
  const [depts, setDepts] = useState(initialDepts);
  const [editingId, setEditingId] = useState<string | null>(initialEditingId ?? null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDragStart(id: string) {
    setDraggingId(id);
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    if (dragOverId !== id) setDragOverId(id);
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }

    const next = [...depts];
    const fromIdx = next.findIndex((d) => d.id === draggingId);
    const toIdx = next.findIndex((d) => d.id === targetId);
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);

    setDepts(next);
    setDraggingId(null);
    setDragOverId(null);

    startTransition(() => {
      reorderDepartments(next.map((d, i) => ({ id: d.id, sort_order: i })));
    });
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverId(null);
  }

  if (!depts.length) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-[color:var(--dc-edge)] bg-dc-surface px-6 py-10 text-center">
        <p className="text-sm text-dc-text-2">No departments yet.</p>
      </div>
    );
  }

  return (
    <ul className="mt-4 divide-y divide-[color:var(--dc-edge)] overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface shadow-xs">
      {depts.map((dept) => {
        const isHR = dept.name === "HR";
        const memberCount = countByDeptId[dept.id] ?? 0;
        const isEditing = editingId === dept.id;
        const isDragging = draggingId === dept.id;
        const isDragOver = dragOverId === dept.id && draggingId !== dept.id;
        const iconKey = dept.icon_key in DEPT_ICONS ? dept.icon_key : "building-2";
        const { Icon } = DEPT_ICONS[iconKey];

        return (
          <li
            key={dept.id}
            className={[
              "flex flex-col transition-opacity",
              isDragging ? "opacity-40" : "",
              isDragOver ? "bg-(--color-brand)/5 ring-1 ring-inset ring-(--color-brand)/20" : "",
            ].join(" ")}
            onDragOver={(e) => handleDragOver(e, dept.id)}
            onDrop={(e) => handleDrop(e, dept.id)}
          >
            {/* ── Row header ──────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                {/* Drag handle */}
                <div
                  draggable
                  onDragStart={() => handleDragStart(dept.id)}
                  onDragEnd={handleDragEnd}
                  className="shrink-0 cursor-grab touch-none select-none text-dc-text-3 hover:text-dc-text-2 active:cursor-grabbing"
                  title="Drag to reorder"
                  aria-label="Drag to reorder"
                  role="button"
                  tabIndex={0}
                >
                  <GripVertical className="size-4" strokeWidth={2} />
                </div>

                {/* Colour + icon badge */}
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: dept.color_hex }}
                >
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

              {/* Actions */}
              {!isEditing ? (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(dept.id)}
                    className="flex items-center gap-1.5 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-1.5 text-xs font-medium text-dc-text-2 hover:bg-dc-overlay hover:text-dc-text"
                  >
                    <Pencil className="size-3" strokeWidth={2} />
                    Edit
                  </button>
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
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="shrink-0 rounded-md border border-[color:var(--dc-edge)] bg-dc-raised px-3 py-1.5 text-xs font-medium text-dc-text-2 hover:bg-dc-overlay hover:text-dc-text"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* ── Inline edit form ─────────────────────────────────────────── */}
            {isEditing ? (
              <form
                // Await the action then close the panel; updateDepartment no longer redirects.
                action={async (fd) => {
                  await updateDepartment(fd);
                  setEditingId(null);
                }}
                className="flex flex-col gap-5 border-t border-[color:var(--dc-edge)] bg-dc-raised/40 px-5 py-5"
              >
                <input type="hidden" name="id" value={dept.id} />
                {/* Disabled inputs don't submit — send the locked name via hidden field */}
                {isHR && <input type="hidden" name="name" value={dept.name} />}

                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>
                    Department name
                    <span className="ml-1 text-(--color-signal-urgent)">*</span>
                  </span>
                  <input
                    name={isHR ? undefined : "name"}
                    type="text"
                    required={!isHR}
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

                <ColorPickerClient defaultValue={dept.color_hex} />

                <IconPicker defaultValue={iconKey} />

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
  );
}
