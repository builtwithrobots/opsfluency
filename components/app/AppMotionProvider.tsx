"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";

/**
 * Thin client wrapper that installs `MotionConfig reducedMotion="user"` for
 * the worker PWA tree. Framer Motion's JS animations don't read the global
 * `prefers-reduced-motion` CSS rule on their own — this is what wires them
 * to it. CSS animations and transitions still collapse via the global rule
 * in `app/globals.css`.
 */
export function AppMotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
