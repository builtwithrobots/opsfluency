"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Accent =
  | "brand"
  | "signal-live"
  | "signal-ok"
  | "signal-warn"
  | "signal-urgent"
  | "signal-info"
  | "signal-hub";

const accentTone: Record<Accent, string> = {
  brand:          "text-(--color-brand) bg-(--color-brand)/10",
  "signal-live":  "text-(--color-signal-live) bg-(--color-signal-live)/10",
  "signal-ok":    "text-(--color-signal-ok) bg-(--color-signal-ok)/10",
  "signal-warn":  "text-(--color-signal-warn) bg-(--color-signal-warn)/10",
  "signal-urgent":"text-(--color-signal-urgent) bg-(--color-signal-urgent)/10",
  "signal-info":  "text-(--color-signal-info) bg-(--color-signal-info)/10",
  "signal-hub":   "text-(--color-signal-hub) bg-(--color-signal-hub)/10",
};

interface DashboardStatCardProps {
  label: string;
  value: number | string;
  // Pre-rendered icon element. Must be a ReactNode, not a component —
  // forwardRef components (like lucide-react icons) can't be passed
  // across the Server → Client boundary.
  icon: ReactNode;
  accent?: Accent;
  delay?: number;
}

export function DashboardStatCard({
  label,
  value,
  icon,
  accent = "brand",
  delay = 0,
}: DashboardStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-5 shadow-xs transition-shadow duration-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-[0.12em] text-dc-text-3 uppercase">
            {label}
          </p>
          <p className="font-display mt-3 text-3xl font-semibold text-dc-text tabular-nums">
            {value}
          </p>
        </div>
        <span
          aria-hidden
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${accentTone[accent]}`}
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
