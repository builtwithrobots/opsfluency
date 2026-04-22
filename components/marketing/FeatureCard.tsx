// v1.0.0
// Feature card primitive. Icon + title + description, with an optional
// href that turns the whole card into a link. Hover lift is a CSS
// transform so it respects prefers-reduced-motion via the global CSS
// rule in app/globals.css.
//
// Server component. The hover effect is pure CSS; no Framer Motion here.

import Link from "next/link";
import type { ReactNode } from "react";

type FeatureCardProps = {
  icon?: ReactNode;
  title: ReactNode;
  description: ReactNode;
  href?: string;
  className?: string;
};

const BASE_CLASSES =
  "group flex h-full flex-col gap-4 rounded-xl border border-dc-edge bg-dc-surface p-6 md:p-8 " +
  "transition-[transform,box-shadow,border-color] duration-200 ease-out";

const INTERACTIVE_CLASSES =
  "hover:-translate-y-0.5 hover:border-dc-edge-2 " +
  "hover:shadow-[0_12px_32px_rgba(15,17,23,0.08)] dark:hover:shadow-none";

export function FeatureCard({
  icon,
  title,
  description,
  href,
  className,
}: FeatureCardProps) {
  const classes = [
    BASE_CLASSES,
    href ? INTERACTIVE_CLASSES : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const body = (
    <>
      {icon ? (
        <span
          aria-hidden="true"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--color-brand)_12%,transparent)] text-[var(--color-brand)]"
        >
          {icon}
        </span>
      ) : null}
      <h3
        className="text-xl font-semibold text-dc-text"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h3>
      <p className="text-base leading-relaxed text-dc-text-2">{description}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {body}
      </Link>
    );
  }

  return <div className={classes}>{body}</div>;
}
