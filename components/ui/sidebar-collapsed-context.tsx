"use client";

import { createContext, useContext } from "react";

interface SidebarCollapsedValue {
  collapsed: boolean;
  toggle: () => void;
}

export const SidebarCollapsedContext = createContext<SidebarCollapsedValue>({
  collapsed: false,
  toggle: () => {},
});

export const useSidebarCollapsed = () => useContext(SidebarCollapsedContext);
