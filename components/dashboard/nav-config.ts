import {
  BarChart3,
  Bell,
  Building2,
  FileText,
  HelpCircle,
  Home,
  Languages,
  MonitorSpeaker,
  QrCode,
  Settings2,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Role } from "@/lib/auth/company-context";

/**
 * Viewer discriminator for the dashboard shell. A pure super admin (no
 * `company_members` row) lives in the `superAdmin` kind and only sees
 * Platform nav items — tenant-scoped pages would crash without a
 * company_id. A regular admin / manager / employee is in the `member`
 * kind and sees items tagged for their role. A user who is both a
 * company member AND a super admin (the common dev case) is a member
 * viewer with `isSuperAdmin: true`, which unlocks Platform items on
 * top of their normal role-based nav.
 */
export type Viewer =
  | { kind: "member"; role: Role; companyName: string; isSuperAdmin?: boolean }
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
    { href: "/dashboard/qr",            label: "QR Codes",      icon: QrCode,         match: "prefix", visibility: { member: ["manager"] } },
    { href: "/dashboard/monitors",      label: "Monitors",      icon: MonitorSpeaker, match: "prefix", visibility: { member: ["manager"] } },
    { href: "/dashboard/analytics",     label: "Analytics",     icon: BarChart3,      match: "prefix", visibility: { member: ["manager"] } },
  ],
};

const platform: NavSection = {
  heading: "Platform",
  items: [
    { href: "/dashboard/platform", label: "Console", icon: ShieldCheck, match: "prefix", visibility: { superAdmin: true } },
  ],
};

const footer: NavSection = {
  items: [
    { href: "/dashboard/org-settings", label: "Settings",  icon: Settings2,  match: "prefix", visibility: { member: ["admin"] } },
    { href: "/dashboard/help",         label: "Help",       icon: HelpCircle, match: "prefix", visibility: { member: ["manager"], superAdmin: true } },
    { href: "/dashboard/changelog",    label: "Changelog",  icon: Sparkles,   match: "prefix", visibility: { member: ["manager"], superAdmin: true } },
  ],
};

export const navSections: readonly NavSection[] = [primary, platform] as const;
export const navFooterSection: NavSection = footer;

/**
 * Visibility gate. Super admins are god mode: both the pure-super-admin
 * kind (no company_members row) and the member+super_admin case see
 * every nav item. Clicking through to pages that require company
 * context without an active impersonation session will redirect or
 * 404 — that's an acceptable dev state; per-page access handling
 * lands as each page ships.
 *
 * Normal members follow role rules: admin sees every member-tagged
 * item; manager/employee sees items listing their role explicitly.
 */
export function canSee(item: NavItem, viewer: Viewer): boolean {
  if (viewer.kind === "superAdmin") return true;
  if (viewer.isSuperAdmin) return true;
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
