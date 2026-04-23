"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronDown, GripVertical, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "@/components/ui/dropdown";
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from "@/components/ui/navbar";
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from "@/components/ui/sidebar";
import { useSidebarCollapsed } from "@/components/ui/sidebar-collapsed-context";
import { SidebarLayout } from "@/components/ui/sidebar-layout";

import {
  appDisplayName,
  brandNameClasses,
  canSee,
  isActive,
  navFooterSection,
  superAdminIcon,
  visibleSections,
  type NavItem,
  type Viewer,
} from "./nav-config";

interface AppShellProps {
  viewer: Viewer;
  children: ReactNode;
}

// ── Brand mark ──────────────────────────────────────────────────────────────

function BrandMark() {
  return (
    <motion.span
      aria-hidden
      data-slot="avatar"
      className="relative flex items-center justify-center rounded-lg bg-(--color-brand) shadow-[0_0_12px_rgba(20,184,166,0.35)]"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <span className="font-display text-[10px] font-bold text-white">OF</span>
    </motion.span>
  );
}

// ── Company context label (below header divider) ─────────────────────────────

function ContextLabel({ viewer }: { viewer: Viewer }) {
  const { collapsed } = useSidebarCollapsed();
  if (collapsed) return null;

  if (viewer.kind === "superAdmin") {
    const Icon = superAdminIcon;
    return (
      <span className="flex items-center gap-1.5 px-2 pt-1 text-[11px] font-medium tracking-wide text-(--color-brand) uppercase">
        <Icon className="size-3" strokeWidth={2} />
        Super admin
      </span>
    );
  }
  const SuperIcon = superAdminIcon;
  return (
    <span className="flex flex-col gap-0.5 px-2 pt-1">
      <span className="block truncate text-[11px] font-medium tracking-wide text-dc-text-3 uppercase">
        {viewer.companyName}
      </span>
      {viewer.isSuperAdmin ? (
        <span className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-(--color-brand) uppercase">
          <SuperIcon className="size-3" strokeWidth={2} />
          Super admin
        </span>
      ) : null}
    </span>
  );
}

// ── User footer ──────────────────────────────────────────────────────────────

function ViewerFooter({ viewer }: { viewer: Viewer }) {
  const { user } = useUser();
  const { collapsed } = useSidebarCollapsed();

  const name = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || null
    : null;
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const roleLabel = viewer.kind === "superAdmin" ? "Super admin" : viewer.role;

  return (
    <div
      className={`flex min-w-0 items-center gap-3 px-2 py-2 ${
        collapsed ? "justify-center" : ""
      }`}
      title={collapsed ? (name ?? email ?? roleLabel) : undefined}
    >
      <span className="flex size-9 shrink-0 items-center justify-center">
        <UserButton
          appearance={{ elements: { avatarBox: "size-9 rounded-full" } }}
        />
      </span>
      {!collapsed && (
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm/5 font-medium text-dc-text">
            {name ?? email ?? roleLabel}
          </span>
          <span className="block truncate text-xs/5 text-dc-text-2">
            {email ?? <span className="capitalize">{roleLabel}</span>}
          </span>
        </span>
      )}
    </div>
  );
}

// ── Collapse toggle ──────────────────────────────────────────────────────────

function CollapseToggle() {
  const { collapsed, toggle } = useSidebarCollapsed();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className={`flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-dc-text-3 hover:bg-zinc-950/5 hover:text-dc-text transition-colors ${
        collapsed ? "w-full justify-center" : "w-full"
      }`}
    >
      {collapsed ? (
        <ChevronRight className="size-4 shrink-0" strokeWidth={2} />
      ) : (
        <>
          <ChevronLeft className="size-4 shrink-0" strokeWidth={2} />
          <span>Collapse</span>
        </>
      )}
    </button>
  );
}

// ── Draggable primary nav list ────────────────────────────────────────────────

const STORAGE_KEY = "nav-primary-order";

function DraggableNavList({
  items,
  pathname,
}: {
  items: NavItem[];
  pathname: string;
}) {
  const { collapsed } = useSidebarCollapsed();

  // Ordered hrefs, loaded from localStorage
  const [order, setOrder] = useState<string[]>([]);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setOrder(JSON.parse(stored) as string[]);
    } catch {}
  }, []);

  const dragItemRef = useRef<string | null>(null);
  const [dragOverHref, setDragOverHref] = useState<string | null>(null);

  // Apply saved order (unknown hrefs appended to end)
  const ordered =
    order.length > 0
      ? [
          ...order.filter((h) => items.some((i) => i.href === h)).map((h) => items.find((i) => i.href === h)!),
          ...items.filter((i) => !order.includes(i.href)),
        ]
      : items;

  function handleDragStart(href: string) {
    dragItemRef.current = href;
  }

  function handleDragOver(e: React.DragEvent, href: string) {
    e.preventDefault();
    setDragOverHref(href);
  }

  function handleDrop(targetHref: string) {
    const from = dragItemRef.current;
    if (!from || from === targetHref) {
      setDragOverHref(null);
      return;
    }
    const hrefs = ordered.map((i) => i.href);
    const fromIdx = hrefs.indexOf(from);
    const toIdx = hrefs.indexOf(targetHref);
    const next = [...hrefs];
    next.splice(fromIdx, 1);
    next.splice(toIdx, 0, from);
    setOrder(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    dragItemRef.current = null;
    setDragOverHref(null);
  }

  function handleDragEnd() {
    dragItemRef.current = null;
    setDragOverHref(null);
  }

  return (
    <AnimatePresence initial={false}>
      {ordered.map((item, index) => {
        const Icon = item.icon;
        const active = isActive(item, pathname);
        const isDragOver = dragOverHref === item.href;

        return (
          <motion.div
            key={item.href}
            draggable
            onDragStart={() => handleDragStart(item.href)}
            onDragOver={(e) => handleDragOver(e, item.href)}
            onDrop={() => handleDrop(item.href)}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, delay: index * 0.02, ease: "easeOut" }}
            className={`group/drag-item relative transition-colors ${
              isDragOver ? "rounded-lg ring-2 ring-(--color-brand)/40 bg-(--color-brand)/5" : ""
            }`}
            title={collapsed ? item.label : undefined}
          >
            <SidebarItem href={item.href} current={active}>
              <Icon data-slot="icon" strokeWidth={2} />
              {!collapsed && (
                <>
                  <SidebarLabel>{item.label}</SidebarLabel>
                  <GripVertical
                    className="ml-auto size-3.5 shrink-0 cursor-grab text-dc-text-3 opacity-0 group-hover/drag-item:opacity-100 transition-opacity"
                    strokeWidth={2}
                  />
                </>
              )}
            </SidebarItem>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}

// ── Static nav list (no DnD) ─────────────────────────────────────────────────

function StaticNavList({
  items,
  pathname,
}: {
  items: NavItem[];
  pathname: string;
}) {
  const { collapsed } = useSidebarCollapsed();

  return (
    <AnimatePresence initial={false}>
      {items.map((item, index) => {
        const Icon = item.icon;
        const active = isActive(item, pathname);
        return (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, delay: index * 0.02, ease: "easeOut" }}
            title={collapsed ? item.label : undefined}
          >
            <SidebarItem href={item.href} current={active}>
              <Icon data-slot="icon" strokeWidth={2} />
              {!collapsed && <SidebarLabel>{item.label}</SidebarLabel>}
            </SidebarItem>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}

// ── Sidebar contents (needs to be a component to use context hooks) ──────────

function SidebarContents({ viewer }: { viewer: Viewer }) {
  const pathname = usePathname() ?? "/dashboard";
  const { collapsed } = useSidebarCollapsed();
  const sections = visibleSections(viewer);
  const footerItems = navFooterSection.items.filter((item) => canSee(item, viewer));

  return (
    <Sidebar>
      <SidebarHeader>
        <Dropdown>
          <DropdownButton as={SidebarItem} aria-label="Workspace menu">
            <BrandMark />
            {!collapsed && (
              <>
                <SidebarLabel>
                  <span className={brandNameClasses}>{appDisplayName}</span>
                </SidebarLabel>
                <ChevronDown data-slot="icon" strokeWidth={2} />
              </>
            )}
          </DropdownButton>
          <DropdownMenu className="min-w-64" anchor="bottom start">
            {viewer.kind === "member" ? (
              <DropdownItem href="/dashboard/org-settings">
                <DropdownLabel>Workspace settings</DropdownLabel>
              </DropdownItem>
            ) : null}
            <DropdownDivider />
            <DropdownItem href="/sign-out">
              <LogOut data-slot="icon" strokeWidth={2} />
              <DropdownLabel>Sign out</DropdownLabel>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
        <ContextLabel viewer={viewer} />
      </SidebarHeader>

      <SidebarBody>
        {sections.map((section, sectionIndex) => (
          <SidebarSection key={section.heading ?? `section-${sectionIndex}`}>
            {section.heading && !collapsed ? (
              <SidebarHeading>{section.heading}</SidebarHeading>
            ) : null}

            {section.reorderable ? (
              <DraggableNavList items={section.items} pathname={pathname} />
            ) : (
              <StaticNavList items={section.items} pathname={pathname} />
            )}
          </SidebarSection>
        ))}

        <SidebarSpacer />

        {footerItems.length > 0 ? (
          <SidebarSection>
            {footerItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.href}
                  title={collapsed ? item.label : undefined}
                >
                  <SidebarItem href={item.href}>
                    <Icon data-slot="icon" strokeWidth={2} />
                    {!collapsed && <SidebarLabel>{item.label}</SidebarLabel>}
                  </SidebarItem>
                </div>
              );
            })}
          </SidebarSection>
        ) : null}

        {/* Collapse toggle — desktop only */}
        <SidebarSection className="max-lg:hidden">
          <CollapseToggle />
        </SidebarSection>
      </SidebarBody>

      <SidebarFooter className="max-lg:hidden">
        <ViewerFooter viewer={viewer} />
      </SidebarFooter>
    </Sidebar>
  );
}

// ── App shell ────────────────────────────────────────────────────────────────

function AnimatedContent({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/dashboard";
  return (
    <motion.div
      key={pathname}
      className="mx-auto w-full max-w-7xl"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function AppShell({ viewer, children }: AppShellProps) {
  return (
    <SidebarLayout
      navbar={
        <Navbar>
          <NavbarSpacer />
          <NavbarSection>
            <NavbarItem aria-label="Account">
              <UserButton />
            </NavbarItem>
          </NavbarSection>
        </Navbar>
      }
      sidebar={<SidebarContents viewer={viewer} />}
    >
      <AnimatedContent>{children}</AnimatedContent>
    </SidebarLayout>
  );
}
