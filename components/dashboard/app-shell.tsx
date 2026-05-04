"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronRight as ArrowRight, CircleHelp, Eye, GripVertical, Smartphone, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

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
import { SpeechLogo } from "@/components/ui/SpeechLogo";

import {
  brandNameClasses,
  canSee,
  isActive,
  navFooterSection,
  visibleSections,
  type NavItem,
  type SetupPrompt,
  type Viewer,
} from "./nav-config";

interface AppShellProps {
  viewer: Viewer;
  children: ReactNode;
}

// ── Brand mark ──────────────────────────────────────────────────────────────

function BrandMark() {
  return <SpeechLogo size="lg" className="shrink-0" />;
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

const utilityButtonClass =
  "relative inline-flex h-11 w-11 items-center justify-center rounded-md border border-dc-edge bg-dc-surface text-dc-text transition-colors hover:bg-dc-raised";

function CollapseToggle() {
  const { collapsed, toggle } = useSidebarCollapsed();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className={utilityButtonClass}
    >
      {collapsed ? (
        <ChevronRight className="h-5 w-5" strokeWidth={2} />
      ) : (
        <ChevronLeft className="h-5 w-5" strokeWidth={2} />
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

  // Pinned items always stay at the top; only non-pinned items are stored/reordered.
  const pinnedItems = items.filter((i) => i.pinned);
  const draggableItems = items.filter((i) => !i.pinned);

  // Ordered hrefs for draggable items only, loaded from localStorage
  const [order, setOrder] = useState<string[]>([]);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setOrder(JSON.parse(stored) as string[]);
    } catch {}
  }, []);

  const dragItemRef = useRef<string | null>(null);
  const [dragOverHref, setDragOverHref] = useState<string | null>(null);

  // Apply saved order to draggable items only (unknown hrefs appended to end)
  const orderedDraggable =
    order.length > 0
      ? [
          ...order.filter((h) => draggableItems.some((i) => i.href === h)).map((h) => draggableItems.find((i) => i.href === h)!),
          ...draggableItems.filter((i) => !order.includes(i.href)),
        ]
      : draggableItems;

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
    const hrefs = orderedDraggable.map((i) => i.href);
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

  function renderNavItem(item: NavItem, index: number, draggable: boolean) {
    const Icon = item.icon;
    const active = isActive(item, pathname);
    const isDragOver = dragOverHref === item.href;

    return (
      <motion.div
        key={item.href}
        draggable={draggable && !collapsed}
        onDragStart={draggable ? () => handleDragStart(item.href) : undefined}
        onDragOver={draggable ? (e) => handleDragOver(e, item.href) : undefined}
        onDrop={draggable ? () => handleDrop(item.href) : undefined}
        onDragEnd={draggable ? handleDragEnd : undefined}
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
            {draggable && (
              <GripVertical
                className="ml-auto size-3.5 shrink-0 cursor-grab text-dc-text-3 opacity-0 group-hover/drag-item:opacity-100 transition-opacity"
                strokeWidth={2}
              />
            )}
          </SidebarItem>
        )}
      </motion.div>
    );
  }

  return (
    <AnimatePresence initial={false}>
      {pinnedItems.map((item, index) => renderNavItem(item, index, false))}
      {orderedDraggable.map((item, index) => renderNavItem(item, pinnedItems.length + index, true))}
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

// ── Setup prompt pill ────────────────────────────────────────────────────────

function SetupPromptPill({ prompt }: { prompt: SetupPrompt }) {
  const { collapsed } = useSidebarCollapsed();

  if (collapsed) {
    return (
      <div className="relative flex justify-center pb-1">
        <Link
          href={prompt.nextHref}
          title={`${prompt.remaining} setup task${prompt.remaining === 1 ? "" : "s"} remaining — ${prompt.nextLabel}`}
          className="relative flex size-9 items-center justify-center rounded-lg bg-(--color-brand)/10 text-(--color-brand) hover:bg-(--color-brand)/20 transition-colors"
        >
          <Zap className="size-4" strokeWidth={2} />
          <span
            aria-hidden
            className="absolute right-1 top-1 size-2 rounded-full bg-(--color-brand)"
          />
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-1">
      <Link
        href={prompt.nextHref}
        className="flex items-center gap-2.5 rounded-lg border border-(--color-brand)/20 bg-(--color-brand)/8 px-3 py-2.5 text-(--color-brand) hover:bg-(--color-brand)/14 transition-colors group"
      >
        <Zap className="size-4 shrink-0" strokeWidth={2} />
        <span className="flex-1 min-w-0 text-xs font-semibold leading-tight">
          {prompt.remaining === 1
            ? prompt.nextLabel
            : `${prompt.remaining} setup tasks left`}
        </span>
        <ArrowRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
      </Link>
    </div>
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
        <div className="flex items-center gap-3 px-2 py-2">
          <BrandMark />
          {!collapsed && (
            <span className="flex flex-col min-w-0">
              <span className={`${brandNameClasses} font-bold leading-none`}>
                OPS<span className="text-(--color-brand)">FLUENCY</span>
              </span>
              <span className="mt-0.5 text-[10px] font-medium tracking-[0.12em] text-dc-text-3 uppercase leading-none">
                Frontline Intelligence
              </span>
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarBody>
        {/* ── Setup prompt pill (above nav, hidden once all tasks done) ── */}
        {viewer.kind === "member" && viewer.setupPrompt ? (
          <SetupPromptPill prompt={viewer.setupPrompt} />
        ) : null}

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

        {/* Utility row — desktop only */}
        <SidebarSection className="max-lg:hidden">
          <div className="flex w-full items-center gap-2">
            {!collapsed && <ThemeToggle />}
            {!collapsed && (
              <Link
                href="/dashboard/emulator"
                aria-label="Worker app emulator"
                title="Worker app emulator"
                className={utilityButtonClass}
              >
                <Eye className="h-5 w-5" strokeWidth={2} />
              </Link>
            )}
            {!collapsed && (
              <a
                href="#"
                aria-label="Help & documentation"
                title="Help & documentation"
                className={utilityButtonClass}
              >
                <CircleHelp className="h-5 w-5" strokeWidth={2} />
              </a>
            )}
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
            <NavbarItem href="/dashboard/emulator" aria-label="Worker app emulator">
              <Smartphone strokeWidth={2} />
            </NavbarItem>
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
