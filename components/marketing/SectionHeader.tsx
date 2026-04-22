// v1.0.0
// Eyebrow + h2 + optional subhead. Used at the top of every non-hero
// marketing section. Server component.
//
// - Eyebrow: Chakra Petch, uppercase, tracking-widest, text-xs, brand teal
//   (MASTER section 6 eyebrow spec).
// - Heading: Chakra Petch, semibold, text-3xl / text-4xl / text-5xl
//   (MASTER section 2 section-h2 scale).
// - Subhead: Inter, text-lg / text-xl, dc-text-2.
//
// The caller is expected to wrap this in a <section aria-labelledby={id}>
// when the page has multiple sections; this component emits the
// heading's id attribute when one is passed.

import type { ReactNode } from "react";

type Align = "center" | "left";

type SectionHeaderProps = {
  eyebrow?: ReactNode;
  heading: ReactNode;
  subhead?: ReactNode;
  align?: Align;
  id?: string;
  className?: string;
};

const ALIGN_CLASSES: Record<Align, string> = {
  center: "items-center text-center mx-auto",
  left: "items-start text-left",
};

export function SectionHeader({
  eyebrow,
  heading,
  subhead,
  align = "center",
  id,
  className,
}: SectionHeaderProps) {
  const classes = [
    "flex flex-col gap-4 max-w-3xl",
    ALIGN_CLASSES[align],
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      {eyebrow ? (
        <span
          className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {eyebrow}
        </span>
      ) : null}
      <h2
        id={id}
        className="text-3xl font-semibold tracking-tight text-dc-text md:text-4xl lg:text-5xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {heading}
      </h2>
      {subhead ? (
        <p className="text-lg leading-relaxed text-dc-text-2 md:text-xl">
          {subhead}
        </p>
      ) : null}
    </div>
  );
}
