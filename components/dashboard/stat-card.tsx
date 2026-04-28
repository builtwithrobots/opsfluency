"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Accent = "brand" | "neutral" | "signal-live" | "signal-ok" | "signal-warn" | "signal-urgent" | "signal-info" | "signal-hub";

const accentTone: Record<Accent, string> = {
  brand:           "text-(--color-brand) bg-(--color-brand)/10",
  neutral:         "text-dc-text-3 bg-dc-raised",
  "signal-live":   "text-(--color-signal-live) bg-(--color-signal-live)/10",
  "signal-ok":     "text-(--color-signal-ok) bg-(--color-signal-ok)/10",
  "signal-warn":   "text-(--color-signal-warn) bg-(--color-signal-warn)/10",
  "signal-urgent": "text-(--color-signal-urgent) bg-(--color-signal-urgent)/10",
  "signal-info":   "text-(--color-signal-info) bg-(--color-signal-info)/10",
  "signal-hub":    "text-(--color-signal-hub) bg-(--color-signal-hub)/10",
};

interface DashboardStatCardProps {
  label: string;
  value: number | string;
  // Pre-rendered icon element. Must be a ReactNode, not a component —
  // forwardRef components (like lucide-react icons) can't be passed
  // across the Server → Client boundary.
  icon: ReactNode;
  accent?: Accent;
  context?: string;
  delay?: number;
  className?: string;
}

export function DashboardStatCard({
  label,
  value,
  icon,
  accent = "brand",
  context,
  delay = 0,
  className,
}: DashboardStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className={`group relative overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-5 shadow-(--shadow-card) transition-shadow duration-200 hover:shadow-(--shadow-raised)${className ? ` ${className}` : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-[0.1em] text-dc-text-3 uppercase truncate">
            {label}
          </p>
          <p className="mt-2.5 text-3xl font-semibold text-dc-text tabular-nums">
            {value}
          </p>
          {context && (
            <p className="mt-1 text-[11px] text-dc-text-3 truncate">{context}</p>
          )}
        </div>
        <span
          aria-hidden
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${accentTone[accent]}`}
        >
          {icon}
        </span>
      </div>
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left bg-(--color-brand)"
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </motion.div>
  );
}
