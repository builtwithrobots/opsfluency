"use client";

import { Home, ScanLine, FileText, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { WorkerLanguage } from "@/lib/types/sop";

interface Props {
  lang: WorkerLanguage;
}

const LABELS = {
  en: { home: "Home", scan: "Scan", sops: "SOPs", profile: "Profile" },
  es: { home: "Inicio", scan: "Escanear", sops: "SOPs", profile: "Perfil" },
} as const;

const ITEMS = [
  { key: "home", href: "/app/home", icon: Home, match: "exact" as const },
  { key: "scan", href: "/app/scan", icon: ScanLine, match: "prefix" as const },
  { key: "sops", href: "/app/search", icon: FileText, match: "prefix" as const },
  { key: "profile", href: "/app/profile", icon: User, match: "prefix" as const },
] as const;

/**
 * Sticky bottom nav for the worker PWA. Mirrors the standard mobile
 * app pattern: 4 icons + labels along the bottom edge, active item
 * highlighted in brand color. Sits above the iOS home indicator
 * area via the safe-area-inset-bottom env var.
 */
export function BottomNav({ lang }: Props) {
  const pathname = usePathname() ?? "";
  const labels = LABELS[lang];

  return (
    <nav
      aria-label={lang === "es" ? "Navegación principal" : "Primary navigation"}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-dc-edge bg-dc-surface/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.match === "exact"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const label = labels[item.key];
          return (
            <li key={item.key} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-[11px] font-medium transition-colors",
                  active
                    ? "text-(--color-brand)"
                    : "text-dc-text-2 hover:text-dc-text",
                ].join(" ")}
              >
                <Icon
                  className="size-5"
                  strokeWidth={active ? 2.5 : 2}
                  aria-hidden
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
