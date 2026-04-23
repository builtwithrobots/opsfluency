"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, ChevronLeft, ChevronRight, ChevronDown, GripVertical, LogOut } from "lucide-react";
import Link from "next/link";
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
import { Button } from "@/components/ui/button";
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

import { ThemeToggle } from "@/components/theme/ThemeToggle";

import {
  brandNameClasses,
  canSee,
  isActive,
  navFooterSection,
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
      className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-(--color-brand)"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Building2 className="size-5 text-white" strokeWidth={2} />
    </motion.span>
  );
}

// ── Company context label (above user footer, below footer divider) ──────────

function ContextLabel({ viewer }: { viewer: Viewer }) {
  const { collapsed } = useSidebarCollapsed();
  if (collapsed || viewer.kind !== "member") return null;
  return (
    <span className="flex items-center justify-between gap-2 px-2 pb-0">
      <span className="truncate text-[11px] font-medium tracking-wide text-dc-text-3 uppercase">
        {viewer.companyName}
      </span>
      <span className="inline-flex shrink-0 items-center rounded border border-[color:var(--color-brand)]/20 bg-[color:var(--color-brand)]/10 px-1.5 py-0.5 text-[10px] font-semibold capitalize tracking-wide text-[color:var(--color-brand)]">
        {viewer.role}
      </span>
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
          {email && (
            <span className="block truncate text-xs/5 text-dc-text-2">
              {email}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

// ── Collapse toggle ──────────────────────────────────────────────────────────

function CollapseToggle() {
  const { collapsed, toggle } = useSidebarCollapsed();
  return (
    <Button
      outline
      className="h-11"
      onClick={toggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? (
        <ChevronRight data-slot="icon" strokeWidth={2} />
      ) : (
        <>
          <ChevronLeft data-slot="icon" strokeWidth={2} />
          Collapse
        </>
      )}
    </Button>
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
            draggable={!collapsed}
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
          >
            {collapsed ? (
              <Link
                href={item.href}
                title={item.label}
                className={`flex w-full justify-center rounded-lg py-2.5 hover:bg-zinc-950/5 ${
                  active ? "bg-zinc-950/5" : ""
                }`}
              >
                <Icon
                  className={`size-5 shrink-0 ${active ? "text-zinc-950" : "text-zinc-500"}`}
                  strokeWidth={2}
                />
              </Link>
            ) : (
              <SidebarItem href={item.href} current={active}>
                <Icon data-slot="icon" strokeWidth={2} />
                <SidebarLabel>{item.label}</SidebarLabel>
                <GripVertical
                  className="ml-auto size-3.5 shrink-0 cursor-grab text-dc-text-3 opacity-0 group-hover/drag-item:opacity-100 transition-opacity"
                  strokeWidth={2}
                />
              </SidebarItem>
            )}
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
          >
            {collapsed ? (
              <Link
                href={item.href}
                title={item.label}
                className={`flex w-full justify-center rounded-lg py-2.5 hover:bg-zinc-950/5 ${
                  active ? "bg-zinc-950/5" : ""
                }`}
              >
                <Icon
                  className={`size-5 shrink-0 ${active ? "text-zinc-950" : "text-zinc-500"}`}
                  strokeWidth={2}
                />
              </Link>
            ) : (
              <SidebarItem href={item.href} current={active}>
                <Icon data-slot="icon" strokeWidth={2} />
                <SidebarLabel>{item.label}</SidebarLabel>
              </SidebarItem>
            )}
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
                  <span className={brandNameClasses}>
                    OPS<span className="text-(--color-brand)">FLUENCY</span>
                  </span>
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
                  {collapsed ? (
                    <Link
                      href={item.href}
                      title={item.label}
                      className="flex w-full justify-center rounded-lg py-2.5 hover:bg-zinc-950/5"
                    >
                      <Icon className="size-5 shrink-0 text-zinc-500" strokeWidth={2} />
                    </Link>
                  ) : (
                    <SidebarItem href={item.href}>
                      <Icon data-slot="icon" strokeWidth={2} />
                      <SidebarLabel>{item.label}</SidebarLabel>
                    </SidebarItem>
                  )}
                </div>
              );
            })}
          </SidebarSection>
        ) : null}

        {/* Collapse toggle + theme toggle — desktop only */}
        <SidebarSection className="max-lg:hidden">
          <div className="flex items-center gap-2">
            {!collapsed && <ThemeToggle />}
            <CollapseToggle />
          </div>
        </SidebarSection>
      </SidebarBody>

      <SidebarFooter className="max-lg:hidden">
        <ContextLabel viewer={viewer} />
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
            <ThemeToggle />
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
