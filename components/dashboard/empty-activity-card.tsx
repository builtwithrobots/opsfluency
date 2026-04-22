"use client";

import { motion } from "framer-motion";
import { FileText, Languages, ScanLine, Sparkles } from "lucide-react";
import Link from "next/link";

const PIPELINE = [
  {
    icon: FileText,
    title: "1. Import a document",
    body: "Upload a PDF or DOCX and we'll convert it to clean Markdown.",
    href: "/dashboard/import",
  },
  {
    icon: Languages,
    title: "2. Lock the glossary",
    body: "Define site-specific terms once. Translations stay consistent forever.",
    href: "/dashboard/glossary",
  },
  {
    icon: Sparkles,
    title: "3. Publish bilingually",
    body: "English and Spanish go live together. QR codes print on approval.",
    href: "/dashboard/sops",
  },
  {
    icon: ScanLine,
    title: "4. Track every scan",
    body: "See which SOPs get read, where, and by whom.",
    href: "/dashboard/analytics",
  },
] as const;

export function EmptyActivityCard() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[color:var(--dc-edge)] bg-dc-surface p-8 shadow-xs">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-(--color-brand) opacity-10 blur-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      <div className="relative">
        <p className="font-display text-sm tracking-[0.15em] text-(--color-brand) uppercase">
          Getting started
        </p>
        <h3 className="mt-2 text-xl font-semibold text-dc-text">
          Your first SOP takes about five minutes.
        </h3>
        <p className="mt-2 max-w-xl text-dc-text-2">
          OpsFluency&apos;s pipeline converts, translates, and publishes in one pass.
          Each step below becomes clickable as the module ships.
        </p>

        <ol className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PIPELINE.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.li
                key={step.title}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: 0.08 * i, ease: "easeOut" }}
              >
                <Link
                  href={step.href}
                  className="group flex h-full gap-3 rounded-lg border border-[color:var(--dc-edge)] bg-dc-raised p-4 transition-colors hover:border-(--color-brand)/60"
                >
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-(--color-brand)/10 text-(--color-brand) group-hover:bg-(--color-brand)/15"
                  >
                    <Icon className="size-4" strokeWidth={2} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-dc-text">
                      {step.title}
                    </span>
                    <span className="mt-0.5 block text-sm text-dc-text-2">
                      {step.body}
                    </span>
                  </span>
                </Link>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
