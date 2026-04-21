"use client";

import { UserButton } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

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
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from "@/components/ui/sidebar";
import { SidebarLayout } from "@/components/ui/sidebar-layout";
import type { Role } from "@/lib/auth/company-context";

import {
  appDisplayName,
  brandNameClasses,
  canSee,
  isActive,
  navFooterSection,
  navSections,
} from "./nav-config";

interface AppShellProps {
  role: Role;
  companyName: string;
  children: ReactNode;
}

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

function CompanyContext({ name }: { name: string }) {
  return (
    <span className="block truncate px-2 pt-1 text-[11px] font-medium tracking-wide text-dc-text-3 uppercase">
      {name}
    </span>
  );
}

export function AppShell({ role, companyName, children }: AppShellProps) {
  const pathname = usePathname() ?? "/dashboard";

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
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <Dropdown>
              <DropdownButton as={SidebarItem} aria-label="Company menu">
                <BrandMark />
                <SidebarLabel>
                  <span className={brandNameClasses}>{appDisplayName}</span>
                </SidebarLabel>
                <ChevronDown data-slot="icon" />
              </DropdownButton>
              <DropdownMenu className="min-w-64" anchor="bottom start">
                <DropdownItem href="/dashboard/settings">
                  <DropdownLabel>Workspace settings</DropdownLabel>
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem href="/sign-in">
                  <LogOut data-slot="icon" />
                  <DropdownLabel>Sign out</DropdownLabel>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <CompanyContext name={companyName} />
          </SidebarHeader>

          <SidebarBody>
            {navSections.map((section, sectionIndex) => (
              <SidebarSection key={section.heading ?? `section-${sectionIndex}`}>
                <AnimatePresence initial={false}>
                  {section.items.filter((item) => canSee(item, role)).map((item, index) => {
                    const Icon = item.icon;
                    const active = isActive(item, pathname);
                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.22, delay: index * 0.02, ease: "easeOut" }}
                      >
                        <SidebarItem href={item.href} current={active}>
                          <Icon data-slot="icon" />
                          <SidebarLabel>{item.label}</SidebarLabel>
                        </SidebarItem>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </SidebarSection>
            ))}

            <SidebarSpacer />

            <SidebarSection>
              {navFooterSection.items.filter((item) => canSee(item, role)).map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarItem key={item.href} href={item.href}>
                    <Icon data-slot="icon" />
                    <SidebarLabel>{item.label}</SidebarLabel>
                  </SidebarItem>
                );
              })}
            </SidebarSection>
          </SidebarBody>

          <SidebarFooter className="max-lg:hidden">
            <div className="flex min-w-0 items-center gap-3 px-2 py-2">
              <span className="flex size-9 shrink-0 items-center justify-center">
                <UserButton
                  appearance={{ elements: { avatarBox: "size-9 rounded-full" } }}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm/5 font-medium text-dc-text">
                  Signed in
                </span>
                <span className="block truncate text-xs/5 text-dc-text-2 capitalize">
                  {role}
                </span>
              </span>
            </div>
          </SidebarFooter>
        </Sidebar>
      }
    >
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </SidebarLayout>
  );
}
