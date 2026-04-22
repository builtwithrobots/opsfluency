// v1.0.0
// Big-number statistic with a short label below. Chakra Petch for the
// numeral (display font, tabular-nums, bold), Inter uppercase for the
// label.
//
// `emphasis` wraps the numeral in the .animate-brand-glow utility
// defined in app/globals.css (3s gentle teal pulse). Intended for a
// single stat per section, never applied to all siblings.

import type { ReactNode } from "react";

type StatCalloutProps = {
  value: ReactNode;
  label: ReactNode;
  caption?: ReactNode;
  emphasis?: boolean;
  className?: string;
};

export function StatCallout({
  value,
  label,
  caption,
  emphasis = false,
  className,
}: StatCalloutProps) {
  const classes = [
    "flex flex-col items-start gap-2",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <span
        className={[
          "inline-block text-5xl font-bold tabular-nums tracking-tight text-dc-text md:text-6xl",
          emphasis ? "rounded-md px-3 py-1 animate-brand-glow" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </span>
      <span
        className="text-xs font-semibold uppercase tracking-widest text-dc-text-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {label}
      </span>
      {caption ? (
        <span className="text-sm leading-relaxed text-dc-text-2">{caption}</span>
      ) : null}
    </div>
  );
}
