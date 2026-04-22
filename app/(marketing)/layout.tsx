// v1.0.0
// Route-group layout for the marketing surface. Wraps nav + footer around
// every page in the group. Also installs <MotionConfig reducedMotion="user">
// so Framer Motion strips transform motion under prefers-reduced-motion
// while keeping opacity fades (WCAG-recommended behavior).
//
// The dashboard (/dashboard) and worker PWA (/app) live outside this
// group and do not inherit nav or footer.

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <MarketingNav />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <MarketingFooter />
    </MotionConfig>
  );
}
