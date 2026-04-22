"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PartyPopper, X } from "lucide-react";
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
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative overflow-hidden rounded-xl border border-(--color-brand)/30 bg-gradient-to-br from-(--color-brand)/10 to-(--color-signal-hub)/10 p-5 shadow-xs"
        >
          <motion.span
            aria-hidden
            className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-(--color-brand) opacity-20 blur-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <div className="relative flex items-start gap-4">
            <motion.span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-(--color-brand) text-white"
              initial={{ rotate: -8, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            >
              <PartyPopper className="size-5" strokeWidth={2} />
            </motion.span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-xs tracking-[0.15em] text-(--color-brand) uppercase">
                Workspace created
              </p>
              <h2 className="mt-1 text-lg font-semibold text-dc-text">
                Welcome to {companyName}.
              </h2>
              <p className="mt-1 text-sm text-dc-text-2">
                Your admin account is live and the four default departments
                (Safety, Equipment, Process, HR) are seeded. Import your first SOP
                to start building your multilingual knowledge base.
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
