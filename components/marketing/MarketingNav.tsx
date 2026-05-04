// v1.0.1
// Marketing nav. Sticky top bar, logo left, primary links middle, CTA +
// theme toggle right. Mobile: hamburger opens a full-screen sheet.
// <nav aria-label="Primary">.
//
// Active link state: reads the current pathname and underlines the matching
// nav link. Works for nested paths (e.g., /features/whatever still marks
// Features active).

"use client";

import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/marketing/Button";
import { Container } from "@/components/marketing/Container";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SpeechLogo } from "@/components/ui/SpeechLogo";

type NavLink = { label: string; href: string };

const NAV_LINKS: NavLink[] = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "How it works", href: "/how-it-works" },
  { label: "About", href: "/about" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function MarketingNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => {
    setScrolled(v > 4);
  });

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSheet();
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [sheetOpen, closeSheet]);

  return (
    <nav
      aria-label="Primary"
      className={[
        "sticky top-0 z-40 w-full backdrop-blur-md transition-colors",
        scrolled
          ? "bg-dc-surface/90 border-b border-dc-edge"
          : "bg-dc-bg/70 border-b border-transparent",
      ].join(" ")}
    >
      <Container as="div">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2"
            aria-label="OpsFluency home"
          >
            <SpeechLogo size="sm" />
            <span
              className="text-lg font-bold tracking-tight text-dc-text"
              style={{ fontFamily: "var(--font-display)" }}
            >
              OPS<span style={{ color: "var(--color-brand)" }}>FLUENCY</span>
            </span>
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "inline-flex h-11 items-center rounded-md px-3 text-sm font-medium transition-colors",
                      active
                        ? "text-dc-text"
                        : "text-dc-text-2 hover:text-dc-text hover:bg-dc-raised",
                    ].join(" ")}
                  >
                    {link.label}
                    {active ? (
                      <span
                        aria-hidden="true"
                        className="ml-2 inline-block h-1 w-1 rounded-full bg-[var(--color-brand)]"
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <Button href="/sign-in" variant="ghost" size="sm">
              Sign in
            </Button>
            <Button href="/sign-up" variant="primary" size="sm">
              Start free
            </Button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-label="Open menu"
              aria-expanded={sheetOpen}
              aria-controls="marketing-nav-sheet"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-dc-edge bg-dc-surface text-dc-text hover:bg-dc-raised transition-colors"
            >
              <Menu className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>
      </Container>

      <AnimatePresence>
        {sheetOpen ? (
          <motion.div
            key="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 bg-black/40 md:hidden"
            onClick={closeSheet}
          >
            <motion.div
              id="marketing-nav-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Primary navigation"
              key="sheet"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-0 flex h-dvh w-full max-w-sm flex-col bg-dc-surface shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex h-16 items-center justify-between border-b border-dc-edge px-6">
                <span
                  className="text-lg font-bold tracking-tight text-dc-text"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Menu
                </span>
                <button
                  type="button"
                  onClick={closeSheet}
                  aria-label="Close menu"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-dc-edge bg-dc-surface text-dc-text hover:bg-dc-raised transition-colors"
                >
                  <X className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
              <ul className="flex flex-col gap-1 px-4 py-6">
                {NAV_LINKS.map((link) => {
                  const active = isActive(pathname, link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={closeSheet}
                        aria-current={active ? "page" : undefined}
                        className={[
                          "flex h-12 items-center rounded-md px-3 text-base font-medium transition-colors",
                          active
                            ? "bg-dc-raised text-dc-text"
                            : "text-dc-text-2 hover:text-dc-text hover:bg-dc-raised",
                        ].join(" ")}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-auto flex flex-col gap-3 border-t border-dc-edge px-4 py-6">
                <Button href="/sign-in" variant="secondary" size="lg" fullWidth onClick={closeSheet}>
                  Sign in
                </Button>
                <Button href="/sign-up" variant="primary" size="lg" fullWidth onClick={closeSheet}>
                  Start free
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </nav>
  );
}
