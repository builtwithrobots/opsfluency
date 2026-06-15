// v1.0.0
// Blueprint-style section header. Three pieces:
//   1. Ghost outline numeral (transparent fill, 1.5px stroke in --color-dc-edge-2)
//      Sits left of the text column on md+, above on mobile.
//   2. Kicker row: 8x8px solid teal square + uppercase eyebrow in brand color.
//   3. h2 heading + optional subhead.
//
// Used on every numbered section in the Blueprint refresh. Do NOT use the
// existing SectionHeader for numbered Blueprint sections -- use this instead.

import type { ReactNode } from "react";

type BlueprintSectionHeaderProps = {
  numeral?: string;
  kicker: string;
  heading: ReactNode;
  subhead?: ReactNode;
  id?: string;
  className?: string;
};

export function BlueprintSectionHeader({
  numeral,
  kicker,
  heading,
  subhead,
  id,
  className,
}: BlueprintSectionHeaderProps) {
  return (
    <div
      className={[
        "flex flex-col gap-6 md:flex-row md:items-start",
        numeral ? "md:gap-8" : "md:gap-0",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {numeral ? (
        <span
          aria-hidden="true"
          className="shrink-0 select-none leading-none"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "clamp(46px,7vw,92px)",
            lineHeight: 0.78,
            letterSpacing: "-0.02em",
            color: "transparent",
            WebkitTextStroke: "1.5px var(--color-dc-edge-2)",
          }}
        >
          {numeral}
        </span>
      ) : null}

      <div className="flex flex-col gap-3 max-w-2xl">
        {/* 8x8 teal square + uppercase kicker */}
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="inline-block h-2 w-2 shrink-0"
            style={{ background: "var(--color-brand)" }}
          />
          <span
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {kicker}
          </span>
        </div>

        <h2
          id={id}
          className="text-dc-text"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "clamp(26px,3.4vw,44px)",
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
          }}
        >
          {heading}
        </h2>

        {subhead ? (
          <p
            className="text-base leading-relaxed text-dc-text-2"
            style={{ maxWidth: "560px" }}
          >
            {subhead}
          </p>
        ) : null}
      </div>
    </div>
  );
}
