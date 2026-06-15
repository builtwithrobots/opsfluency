// v1.0.0
// Blueprint card primitive. Sharp 4px radius (not the standard rounded-xl),
// soft layered shadow in light mode, border-only in dark mode (MASTER §4).
//
// Optional corner ticks: four L-shaped marks at panel corners.
// Optional featured: 3px teal top border + teal glow.
// Optional hover: translateY(-3px) + deeper shadow (200ms ease).

import type { ElementType, ReactNode } from "react";

type FramedPanelProps = {
  as?: ElementType;
  featured?: boolean;
  withCornerTicks?: boolean;
  hoverable?: boolean;
  emphasis?: boolean;
  className?: string;
  children: ReactNode;
  [key: string]: unknown;
};

function CornerTick({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const posClass = {
    tl: "-top-px -left-px border-t-2 border-l-2",
    tr: "-top-px -right-px border-t-2 border-r-2",
    bl: "-bottom-px -left-px border-b-2 border-l-2",
    br: "-bottom-px -right-px border-b-2 border-r-2",
  }[position];

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute h-4 w-4 ${posClass}`}
      style={{ borderColor: "var(--color-brand)" }}
    />
  );
}

export function FramedPanel({
  as: Tag = "div",
  featured = false,
  withCornerTicks = false,
  hoverable = false,
  emphasis = false,
  className,
  children,
  ...rest
}: FramedPanelProps) {
  const classes = [
    "relative bg-dc-surface",
    emphasis ? "border border-dc-edge-2" : "border border-dc-edge",
    "rounded-[4px]",
    // Light: layered shadow. Dark: no shadow, border does the work (MASTER §4).
    featured
      ? [
          "border-t-[3px] border-t-[var(--color-brand)]",
          "shadow-[0_1px_2px_rgba(15,17,23,0.04),_0_8px_24px_-14px_rgba(15,17,23,0.12),_0_20px_44px_-18px_rgba(20,184,166,0.4)]",
          "dark:shadow-none dark:border-[var(--color-brand)]",
          "animate-brand-glow",
        ].join(" ")
      : [
          "shadow-[0_1px_2px_rgba(15,17,23,0.04),_0_8px_24px_-14px_rgba(15,17,23,0.12)]",
          "dark:shadow-none",
        ].join(" "),
    hoverable
      ? "transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-[3px] hover:shadow-[0_1px_2px_rgba(15,17,23,0.04),_0_16px_36px_-14px_rgba(15,17,23,0.18)] dark:hover:shadow-none"
      : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={classes} {...rest}>
      {withCornerTicks ? (
        <>
          <CornerTick position="tl" />
          <CornerTick position="tr" />
          <CornerTick position="bl" />
          <CornerTick position="br" />
        </>
      ) : null}
      {children}
    </Tag>
  );
}
