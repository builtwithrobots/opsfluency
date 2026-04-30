"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface WelcomeBannerProps {
  companyName: string;
}

export function WelcomeBanner({ companyName }: WelcomeBannerProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const [, startTransition] = useTransition();

  // Strip the ?welcome=1 from the URL once rendered so refresh doesn't re-show.
  useEffect(() => {
    startTransition(() => {
      router.replace("/dashboard", { scroll: false });
    });
  }, [router]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6, height: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative overflow-hidden rounded-xl border border-(--color-brand)/20 bg-gradient-to-br from-(--color-brand)/8 to-(--color-brand)/4 p-5 shadow-xs"
        >
          <motion.span
            aria-hidden
            className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-(--color-brand) opacity-10 blur-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
          <div className="relative flex items-start gap-4">
            <motion.span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-(--color-brand)/15 text-(--color-brand)"
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
            >
              <CheckCircle2 className="size-5" strokeWidth={2} />
            </motion.span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-dc-text">
                {companyName} is ready.
              </h2>
              <p className="mt-0.5 text-sm text-dc-text-2">
                Your admin account is live and five default departments (HR, Manufacturing, Quality
                Control, Safety, Warehouse) are configured. Import your first SOP to go live.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setVisible(false)}
              aria-label="Dismiss welcome banner"
              className="shrink-0 rounded-md p-1 text-dc-text-3 transition-colors hover:bg-dc-raised hover:text-dc-text"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
