// v1.2.0
// Default reveal-on-scroll primitive for marketing sections.
// Reads from globals.css tokens via Tailwind utilities passed by callers;
// this component contributes no styling of its own.
//
// Default behavior: fade-and-rise on first view, once only, with a viewport
// margin that triggers slightly before the section is fully on screen.
// Pass `variants={staggerContainer}` and wrap children in MotionSectionItem
// when you want staggered reveals.
//
// Shape choices:
//   - MotionSection always renders <motion.section>. Use MotionSectionItem
//     (a standalone named export) for stagger children.
//   - The two are separate named exports, not an Object.assign sub-component,
//     because static RSC serialization drops sub-component references during
//     Next.js static prerender.
//   - Other element types (ul, article, etc.) use framer-motion directly.
//     Creating motion(as) at render time is a memory-leak pattern and is
//     blocked by react-hooks lint.

"use client";

import { motion, type MotionProps, type Variants } from "framer-motion";
import type { ReactNode } from "react";

import { fadeUp, staggerItem } from "@/lib/motion/variants";

type CommonMotionProps = Omit<
  MotionProps,
  "variants" | "children" | "className" | "initial" | "whileInView" | "viewport"
>;

type MotionSectionProps = {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  amount?: number;
  margin?: string;
  once?: boolean;
  id?: string;
  "aria-labelledby"?: string;
  "aria-label"?: string;
} & CommonMotionProps;

export function MotionSection({
  children,
  className,
  variants = fadeUp,
  amount = 0.2,
  margin = "0px 0px -10% 0px",
  once = true,
  ...rest
}: MotionSectionProps) {
  return (
    <motion.section
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount, margin }}
      variants={variants}
      {...rest}
    >
      {children}
    </motion.section>
  );
}

type MotionSectionItemProps = {
  children: ReactNode;
  className?: string;
  variants?: Variants;
} & Omit<MotionProps, "variants" | "children" | "className">;

export function MotionSectionItem({
  children,
  className,
  variants = staggerItem,
  ...rest
}: MotionSectionItemProps) {
  return (
    <motion.div className={className} variants={variants} {...rest}>
      {children}
    </motion.div>
  );
}
