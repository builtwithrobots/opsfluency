"use client";

import { CheckCircle2, Circle, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { ChecklistItem } from "./onboarding-checklist";

interface Props {
  items: ChecklistItem[];
  company_id: string;
  doneCount: number;
}

function storageKey(company_id: string) {
  return `opsf-checklist-dismissed-${company_id}`;
}

export function ChecklistClientWrapper({ items, company_id, doneCount }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(storageKey(company_id));
      if (!dismissed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [company_id]);

  function dismiss() {
    try {
      localStorage.setItem(storageKey(company_id), "1");
    } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  const total = items.length;

  return (
    <div className="relative overflow-hidden rounded-xl border border-(--color-brand)/20 bg-dc-surface shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[color:var(--dc-edge)] px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-0.5">
            {items.map((item) => (
              <span
                key={item.id}
                className={`block h-1.5 w-6 rounded-full transition-colors ${
                  item.done ? "bg-(--color-brand)" : "bg-(--color-brand)/15"
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-dc-text">
            Finish setting up your org
          </span>
          <span className="rounded-full bg-(--color-brand)/10 px-2 py-0.5 text-xs font-semibold text-(--color-brand)">
            {doneCount} / {total}
          </span>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss setup checklist"
          className="shrink-0 rounded-md p-1 text-dc-text-3 transition-colors hover:bg-dc-raised hover:text-dc-text"
        >
          <X className="size-4" strokeWidth={2} />
        </button>
      </div>

      {/* Items */}
      <ul className="divide-y divide-[color:var(--dc-edge)]">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 px-5 py-3.5">
            {item.done ? (
              <CheckCircle2
                className="size-5 shrink-0 text-(--color-brand)"
                strokeWidth={2}
                aria-hidden
              />
            ) : (
              <Circle
                className="size-5 shrink-0 text-dc-text-3"
                strokeWidth={2}
                aria-hidden
              />
            )}

            <span
              className={`flex-1 text-sm ${
                item.done ? "text-dc-text-3 line-through" : "font-medium text-dc-text"
              }`}
            >
              {item.label}
            </span>

            {!item.done && item.href && item.actionLabel ? (
              <Link
                href={item.href}
                className="shrink-0 rounded-md border border-(--color-brand)/30 bg-(--color-brand)/8 px-3 py-1.5 text-xs font-semibold text-(--color-brand) hover:bg-(--color-brand)/15 transition-colors"
              >
                {item.actionLabel} →
              </Link>
            ) : item.done && item.href ? (
              <Link
                href={item.href}
                className="shrink-0 text-xs text-dc-text-3 hover:text-dc-text-2 transition-colors"
              >
                View →
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
