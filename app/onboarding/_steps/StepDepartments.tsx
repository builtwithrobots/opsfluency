"use client";

import { Check, Lock } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import {
  getOnboardingDepartmentsAction,
  updateOnboardingDepartmentAction,
  type OnboardingDepartment,
} from "@/app/onboarding/_actions/wizard-actions";
import { Button } from "@/components/ui/button";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b",
  "#22c55e", "#14b8a6", "#3b82f6",
  "#8b5cf6", "#ec4899", "#64748b",
];

interface Props {
  onContinue: () => void;
}

interface DeptState extends OnboardingDepartment {
  saving: boolean;
  saved: boolean;
  error: string | null;
  editingName: string;
}

export function StepDepartments({ onContinue }: Props) {
  const [depts, setDepts] = useState<DeptState[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await getOnboardingDepartmentsAction();
      if (result.ok) {
        setDepts(
          result.data.map((d) => ({
            ...d,
            saving: false,
            saved: false,
            error: null,
            editingName: d.name,
          })),
        );
      }
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateLocal(id: string, patch: Partial<DeptState>) {
    setDepts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  async function saveDept(dept: DeptState) {
    if (dept.name === "HR") return; // locked
    updateLocal(dept.id, { saving: true, saved: false, error: null });
    const result = await updateOnboardingDepartmentAction({
      id: dept.id,
      name: dept.editingName.trim() || dept.name,
      color_hex: dept.color_hex,
      icon_key: dept.icon_key,
    });
    if (result.ok) {
      updateLocal(dept.id, {
        saving: false,
        saved: true,
        name: dept.editingName.trim() || dept.name,
      });
      setTimeout(() => updateLocal(dept.id, { saved: false }), 1800);
    } else {
      updateLocal(dept.id, { saving: false, error: result.error });
    }
  }

  async function changeColor(dept: DeptState, color: string) {
    updateLocal(dept.id, { color_hex: color, saving: true, saved: false, error: null });
    const result = await updateOnboardingDepartmentAction({
      id: dept.id,
      name: dept.editingName.trim() || dept.name,
      color_hex: color,
      icon_key: dept.icon_key,
    });
    if (result.ok) {
      updateLocal(dept.id, { saving: false, saved: true });
      setTimeout(() => updateLocal(dept.id, { saved: false }), 1800);
    } else {
      updateLocal(dept.id, { saving: false, error: result.error });
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl border border-[color:var(--dc-edge)] bg-dc-raised animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-dc-text-2">
        We&apos;ve created five default departments for your facility. Rename
        them or change their colors to match your org. You can add more in
        Settings later.
      </p>

      <ul className="flex flex-col gap-3">
        {depts.map((d) => (
          <DeptCard
            key={d.id}
            dept={d}
            onNameChange={(name) => updateLocal(d.id, { editingName: name })}
            onNameBlur={() => saveDept(d)}
            onColorChange={(color) => changeColor(d, color)}
          />
        ))}
      </ul>

      <Button type="button" color="brand" onClick={onContinue} className="w-full">
        Continue →
      </Button>
    </div>
  );
}

interface CardProps {
  dept: DeptState;
  onNameChange: (name: string) => void;
  onNameBlur: () => void | Promise<void>;
  onColorChange: (color: string) => void | Promise<void>;
}

function DeptCard({ dept, onNameChange, onNameBlur, onColorChange }: CardProps) {
  const isHR = dept.name === "HR";
  const colorInputRef = useRef<HTMLInputElement>(null);

  return (
    <li className="flex items-center gap-4 rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface px-4 py-3">
      {/* Color swatch — clicking opens native color picker */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => colorInputRef.current?.click()}
          title="Change color"
          className="size-8 rounded-full border-2 border-[color:var(--dc-edge)] transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-(--color-brand)/50"
          style={{ backgroundColor: dept.color_hex }}
          aria-label={`Color for ${dept.name}`}
        />
        <input
          ref={colorInputRef}
          type="color"
          value={dept.color_hex}
          onChange={(e) => onColorChange(e.target.value)}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />
      </div>

      {/* Color preset swatches */}
      <div className="hidden sm:flex shrink-0 items-center gap-1">
        {PRESET_COLORS.map((hex) => (
          <button
            key={hex}
            type="button"
            onClick={() => onColorChange(hex)}
            title={hex}
            className={`size-4 rounded-full border transition-transform hover:scale-110 ${
              dept.color_hex === hex
                ? "border-dc-text scale-110"
                : "border-[color:var(--dc-edge)]"
            }`}
            style={{ backgroundColor: hex }}
            aria-label={`Set color to ${hex}`}
          />
        ))}
      </div>

      {/* Name input */}
      <div className="flex-1 min-w-0">
        {isHR ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-dc-text-2">{dept.name}</span>
            <span className="flex items-center gap-1 text-xs text-dc-text-3">
              <Lock className="size-3" strokeWidth={2} />
              locked
            </span>
          </div>
        ) : (
          <input
            type="text"
            value={dept.editingName}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={onNameBlur}
            maxLength={80}
            className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-dc-text placeholder:text-dc-text-3 hover:border-[color:var(--dc-edge)] focus:border-(--color-brand)/50 focus:outline-none focus:bg-dc-raised transition-colors"
            aria-label={`Rename ${dept.name} department`}
          />
        )}
      </div>

      {/* Save indicator */}
      <div className="shrink-0 w-5 flex items-center justify-center">
        {dept.saving && (
          <span className="size-4 animate-spin rounded-full border-2 border-[color:var(--dc-edge)] border-t-(--color-brand)" />
        )}
        {dept.saved && !dept.saving && (
          <Check className="size-4 text-(--color-brand)" strokeWidth={2.5} />
        )}
        {dept.error && !dept.saving && (
          <span title={dept.error} className="text-xs text-(--color-signal-urgent)">!</span>
        )}
      </div>
    </li>
  );
}
