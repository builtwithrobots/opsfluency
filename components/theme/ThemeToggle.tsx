// v1.1.0
// Icon-only button that flips the .dark class on <html> and persists the
// choice to localStorage under opsf:theme.
//
// Pre-paint application happens in components/theme/theme-script.ts, which
// runs synchronously in <head> before React hydrates. This component only
// reacts to user input after mount.
//
// Theme state lives in the DOM (the .dark class on <html>). We use
// useSyncExternalStore so React reads the authoritative value without
// a setState-in-effect sync step. A small in-memory listener set lets the
// toggle button re-render itself, and we also subscribe to `storage`
// events so multiple tabs stay in sync.

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";

import { THEME_STORAGE_KEY } from "@/components/theme/theme-script";

type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  root.style.colorScheme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage throws in private browsing; the class change still
    // takes effect for the current session.
  }
  listeners.forEach((cb) => cb());
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    applyTheme(theme === "dark" ? "light" : "dark");
  }, [theme]);

  const label =
    theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={
        "relative inline-flex h-11 w-11 items-center justify-center " +
        "rounded-md border border-dc-edge bg-dc-surface text-dc-text " +
        "transition-colors hover:bg-dc-raised " +
        (className ?? "")
      }
    >
      <span className="sr-only">{label}</span>
      <span
        aria-hidden="true"
        className="relative block h-5 w-5"
        suppressHydrationWarning
      >
        <AnimatePresence initial={false} mode="wait">
          {theme === "dark" ? (
            <motion.span
              key="moon"
              initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Moon className="h-5 w-5" strokeWidth={2} />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ opacity: 0, rotate: 90, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -90, scale: 0.8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Sun className="h-5 w-5" strokeWidth={2} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
}
