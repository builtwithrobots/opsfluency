// v1.0.0
// Framer Motion variants for the marketing site.
// Reduced-motion is handled at the <MotionConfig reducedMotion="user">
// boundary in app/(marketing)/layout.tsx; Framer Motion then strips
// transform-based motion and keeps opacity fades per the a11y spec.
// Additionally, the global CSS rule in app/globals.css collapses
// animation-duration / transition-duration to 0.01ms when the user
// prefers reduced motion, so ambient CSS keyframes also respect it.
//
// Timing rules (from design-system/opsfluency/MASTER.md §5.2):
//   micro  150-250ms
//   reveal 300-500ms
//   page   400-600ms
// Stagger on list reveals 30-50ms per child.
// Never animate width, height, top, left, margin, padding. Only
// transform and opacity.

import type { Variants } from "framer-motion";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const EASE_IN = [0.4, 0, 1, 1] as const;

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: EASE_OUT },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE_OUT },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: EASE_OUT },
  },
};

export const slideInFromLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: EASE_OUT },
  },
};

export const slideInFromRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: EASE_OUT },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem: Variants = fadeUp;

export const exitFade: Variants = {
  visible: { opacity: 1 },
  hidden: {
    opacity: 0,
    transition: { duration: 0.2, ease: EASE_IN },
  },
};

export const pressScale = {
  whileTap: { scale: 0.98 },
  transition: { duration: 0.12, ease: "linear" },
} as const;

export const hoverLift = {
  whileHover: { y: -2 },
  transition: { duration: 0.2, ease: EASE_OUT },
} as const;
