import {
  BarChart3,
  Bell,
  Building2,
  FileText,
  HelpCircle,
  Home,
  Languages,
  MonitorSpeaker,
  Sparkles,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Role } from "@/lib/auth/company-context";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  // Match rule: exact path (Home) vs. prefix match (everything else).
  match: "exact" | "prefix";
  // Roles that can see this item. `admin` always sees everything regardless.
  roles: Role[];
}

export interface NavSection {
  heading?: string;
  items: NavItem[];
}

const primary: NavSection = {
  items: [
    { href: "/dashboard",               label: "Home",          icon: Home,           match: "exact",  roles: ["manager"] },
    { href: "/dashboard/sops",          label: "SOPs",          icon: FileText,       match: "prefix", roles: ["manager"] },
    { href: "/dashboard/import",        label: "Import",        icon: Upload,         match: "prefix", roles: ["manager"] },
    { href: "/dashboard/glossary",      label: "Glossary",      icon: Languages,      match: "prefix", roles: ["manager"] },
    { href: "/dashboard/employees",     label: "Employees",     icon: Users,          match: "prefix", roles: ["manager"] },
    { href: "/dashboard/announcements", label: "Announcements", icon: Bell,           match: "prefix", roles: ["manager"] },
    { href: "/dashboard/departments",   label: "Departments",   icon: Building2,      match: "prefix", roles: ["manager"] },
    { href: "/dashboard/monitors",      label: "Monitors",      icon: MonitorSpeaker, match: "prefix", roles: ["manager"] },
    { href: "/dashboard/analytics",     label: "Analytics",     icon: BarChart3,      match: "prefix", roles: ["manager"] },
  ],
};

const footer: NavSection = {
  items: [
    { href: "/dashboard/help",      label: "Help",       icon: HelpCircle, match: "prefix", roles: ["manager"] },
    { href: "/dashboard/changelog", label: "Changelog",  icon: Sparkles,   match: "prefix", roles: ["manager"] },
  ],
};

export const navSections: readonly NavSection[] = [primary] as const;
export const navFooterSection: NavSection = footer;

/**
 * `is` is the user's current role. Admin sees every item; manager sees items
 * tagged `manager`; employee should not reach the dashboard at all but we
 * scope defensively anyway.
 */
export function canSee(item: NavItem, is: Role): boolean {
  if (is === "admin") return true;
  return item.roles.includes(is);
}

/**
 * Resolves whether a given pathname activates a nav item. The distinction
 * between `exact` and `prefix` avoids the Home item highlighting on every
 * sub-route.
 */
export function isActive(item: NavItem, pathname: string): boolean {
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export const appDisplayName = "OpsFluency";

export const brandNameClasses = "font-display tracking-[0.05em] uppercase";
