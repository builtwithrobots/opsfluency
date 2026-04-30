import {
  Bell,
  Building2,
  FileText,
  Home,
  Languages,
  QrCode,
  ScanLine,
  Settings2,
  ShieldCheck,
  Tag,
  User,
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
export interface SetupPrompt {
  /** Remaining incomplete setup tasks count. */
  remaining: number;
  /** Label for the next actionable task. */
  nextLabel: string;
  /** URL to navigate to for the next task. */
  nextHref: string;
}

export type Viewer =
  | { kind: "member"; role: Role; companyName: string; isSuperAdmin?: boolean; setupPrompt?: SetupPrompt }
  | { kind: "superAdmin" };

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  // Match rule: exact path (Home) vs. prefix match (everything else).
  match: "exact" | "prefix";
  // Pinned items always render at the top of a reorderable section and
  // cannot be dragged. They are excluded from localStorage ordering.
  pinned?: boolean;
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
  // Sections with `reorderable: true` have their item order persisted to localStorage.
  reorderable?: boolean;
  items: NavItem[];
}

// Primary — workspace tools with live pages
const primary: NavSection = {
  reorderable: true,
  items: [
    { href: "/dashboard",    label: "Home",      icon: Home,          match: "exact",  pinned: true, visibility: { member: ["manager"] } },
    { href: "/dashboard/qr",   label: "QR Codes", icon: QrCode,    match: "prefix", visibility: { member: ["manager"] } },
    { href: "/dashboard/sops", label: "SOPs",     icon: FileText,  match: "prefix", visibility: { member: ["manager"] } },
    { href: "/dashboard/glossary", label: "Glossary", icon: Languages, match: "prefix", visibility: { member: ["manager"] } },
    // Cross-boundary link into the worker PWA scanner. Employees never see
    // this entry (the dashboard isn't theirs anyway); admins and managers
    // jump into /app/scan, which renders the same scanner workers use, with
    // the PreviewBanner offering a one-click "Back to dashboard" return.
    { href: "/app/scan",            label: "Scanner",  icon: ScanLine,  match: "prefix", visibility: { member: ["manager"] } },
    { href: "/dashboard/announcements", label: "Announcements", icon: Bell,           match: "prefix", visibility: { member: ["manager"] } },
    // Items below are planned but not yet built; uncomment as pages ship:
    // { href: "/dashboard/import",        label: "Import",        icon: Upload,         match: "prefix", visibility: { member: ["manager"] } },
    // { href: "/dashboard/monitors",      label: "Monitors",      icon: MonitorSpeaker, match: "prefix", visibility: { member: ["manager"] } },
    // { href: "/dashboard/analytics",     label: "Analytics",     icon: BarChart3,      match: "prefix", visibility: { member: ["manager"] } },
  ],
};

// Settings — org and user configuration
const settings: NavSection = {
  heading: "Settings",
  items: [
    { href: "/dashboard/org-settings", label: "Org Settings", icon: Settings2,      match: "prefix", visibility: { member: ["admin"] } },
    { href: "/dashboard/my-settings",  label: "My Settings",  icon: User,           match: "prefix", visibility: { member: ["manager"] } },
    { href: "/dashboard/employees",    label: "Employees",    icon: Users,          match: "prefix", visibility: { member: ["manager"] } },
    { href: "/dashboard/departments",  label: "Departments",  icon: Building2,      match: "prefix", visibility: { member: ["manager"] } },
    { href: "/dashboard/labels",       label: "Labels",       icon: Tag,             match: "prefix", visibility: { member: ["admin"] } },
  ],
};

// Platform — super admin only
const platform: NavSection = {
  heading: "Platform",
  items: [
    { href: "/dashboard/platform", label: "Console", icon: ShieldCheck, match: "prefix", visibility: { superAdmin: true } },
  ],
};

export const navSections: readonly NavSection[] = [primary, settings, platform] as const;

// Footer section: empty — Settings moved to its own section; Help/Changelog
// pages not yet built. Restore items here as stubs ship.
export const navFooterSection: NavSection = { items: [] };

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
 * Resolves whether a given pathname activates a nav item.
 */
export function isActive(item: NavItem, pathname: string): boolean {
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Returns only sections that have at least one visible item for the viewer.
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

export const superAdminIcon = ShieldCheck;
