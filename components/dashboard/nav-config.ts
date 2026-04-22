import {
  BarChart3,
  Bell,
  Building2,
  FileText,
  HelpCircle,
  Home,
  Languages,
  MonitorSpeaker,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Role } from "@/lib/auth/company-context";

/**
 * Viewer discriminator for the dashboard shell. A super admin is not a
 * company member, so they carry no `role` or `companyName` — they only
 * see Platform nav items. Regular admins / managers / employees carry
 * both and see items tagged for their role.
 */
export type Viewer =
  | { kind: "member"; role: Role; companyName: string }
  | { kind: "superAdmin" };

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  // Match rule: exact path (Home) vs. prefix match (everything else).
  match: "exact" | "prefix";
  // Visibility. `member: Role[]` lists which org-scoped roles see the
  // item (admin always sees everything). `superAdmin: true` adds it to
  // the super-admin sidebar. Omit a key to hide for that viewer kind.
  visibility: {
    member?: Role[];
    superAdmin?: boolean;
  };
}

export interface NavSection {
  heading?: string;
  items: NavItem[];
}

const primary: NavSection = {
  items: [
    { href: "/dashboard",               label: "Home",          icon: Home,           match: "exact",  visibility: { member: ["manager"] } },
    { href: "/dashboard/sops",          label: "SOPs",          icon: FileText,       match: "prefix", visibility: { member: ["manager"] } },
    { href: "/dashboard/import",        label: "Import",        icon: Upload,         match: "prefix", visibility: { member: ["manager"] } },
    { href: "/dashboard/glossary",      label: "Glossary",      icon: Languages,      match: "prefix", visibility: { member: ["manager"] } },
    { href: "/dashboard/employees",     label: "Employees",     icon: Users,          match: "prefix", visibility: { member: ["manager"] } },
    { href: "/dashboard/announcements", label: "Announcements", icon: Bell,           match: "prefix", visibility: { member: ["manager"] } },
    { href: "/dashboard/departments",   label: "Departments",   icon: Building2,      match: "prefix", visibility: { member: ["manager"] } },
    { href: "/dashboard/monitors",      label: "Monitors",      icon: MonitorSpeaker, match: "prefix", visibility: { member: ["manager"] } },
    { href: "/dashboard/analytics",     label: "Analytics",     icon: BarChart3,      match: "prefix", visibility: { member: ["manager"] } },
  ],
};

const platform: NavSection = {
  heading: "Platform",
  items: [
    { href: "/dashboard/platform/tenants", label: "Tenants", icon: Building2,    match: "prefix", visibility: { superAdmin: true } },
  ],
};

const footer: NavSection = {
  items: [
    { href: "/dashboard/help",      label: "Help",       icon: HelpCircle, match: "prefix", visibility: { member: ["manager"], superAdmin: true } },
    { href: "/dashboard/changelog", label: "Changelog",  icon: Sparkles,   match: "prefix", visibility: { member: ["manager"], superAdmin: true } },
  ],
};

export const navSections: readonly NavSection[] = [primary, platform] as const;
export const navFooterSection: NavSection = footer;

/**
 * Visibility gate. A non-impersonating super admin sees only items
 * opted into the super-admin sidebar (Platform + Help + Changelog);
 * tenant-scoped pages are reached by impersonating a tenant from
 * `/dashboard/platform/tenants`, which flips the viewer to `member`
 * with `role: 'admin'` and exposes the full primary nav. Admins see
 * every member-tagged item regardless of the role list. Employees
 * should not reach the dashboard at all but we scope defensively
 * anyway.
 */
export function canSee(item: NavItem, viewer: Viewer): boolean {
  if (viewer.kind === "superAdmin") return item.visibility.superAdmin === true;
  if (viewer.role === "admin") return Boolean(item.visibility.member?.length);
  return item.visibility.member?.includes(viewer.role) ?? false;
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

/**
 * Returns only sections that have at least one visible item for the viewer.
 * Keeps empty headings (like an admin-free "Platform" section for a
 * regular manager) from rendering as dead space.
 */
export function visibleSections(viewer: Viewer): NavSection[] {
  return navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canSee(item, viewer)),
    }))
    .filter((section) => section.items.length > 0);
}

export const appDisplayName = "OpsFluency";

export const brandNameClasses = "font-display tracking-[0.05em] uppercase";

/** Icon for the Platform section tagline / badge. */
export const superAdminIcon = ShieldCheck;
