// v1.0.0
// Max-width wrapper for marketing sections. Three widths, consistent
// horizontal gutters. Uses MASTER section 3 spacing values.
//
// Gutter is px-6 on mobile, px-8 at sm, px-12 at lg. Never goes below
// 24px on mobile per the spacing contract.

import type { ElementType, ReactNode } from "react";

type Width = "narrow" | "default" | "wide";

const WIDTH_CLASSES: Record<Width, string> = {
  narrow: "max-w-4xl",
  default: "max-w-7xl",
  wide: "max-w-screen-2xl",
};

type ContainerProps = {
  as?: ElementType;
  width?: Width;
  className?: string;
  children: ReactNode;
};

export function Container({
  as: Tag = "div",
  width = "default",
  className,
  children,
}: ContainerProps) {
  const classes = [
    "mx-auto w-full px-6 sm:px-8 lg:px-12",
    WIDTH_CLASSES[width],
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return <Tag className={classes}>{children}</Tag>;
}
