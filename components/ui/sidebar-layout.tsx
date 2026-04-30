'use client'

import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { NavbarItem } from './navbar'
import { SidebarCollapsedContext } from './sidebar-collapsed-context'

const SIDEBAR_DEFAULT_W = 240
const SIDEBAR_MIN_W     = 180
const SIDEBAR_MAX_W     = 360
const SIDEBAR_COLLAPSED_W = 72

function OpenMenuIcon() {
  return (
    <svg data-slot="icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M2 6.75C2 6.33579 2.33579 6 2.75 6H17.25C17.6642 6 18 6.33579 18 6.75C18 7.16421 17.6642 7.5 17.25 7.5H2.75C2.33579 7.5 2 7.16421 2 6.75ZM2 13.25C2 12.8358 2.33579 12.5 2.75 12.5H17.25C17.6642 12.5 18 12.8358 18 13.25C18 13.6642 17.6642 14 17.25 14H2.75C2.33579 14 2 13.6642 2 13.25Z" />
    </svg>
  )
}

function CloseMenuIcon() {
  return (
    <svg data-slot="icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  )
}

function MobileSidebar({ open, close, children }: React.PropsWithChildren<{ open: boolean; close: () => void }>) {
  return (
    <Headless.Dialog open={open} onClose={close} className="lg:hidden">
      <Headless.DialogBackdrop
        transition
        className="fixed inset-0 bg-black/30 transition data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />
      <Headless.DialogPanel
        transition
        className="fixed inset-y-0 w-full max-w-80 p-2 transition duration-300 ease-in-out data-closed:-translate-x-full"
      >
        <div className="flex h-full flex-col rounded-lg bg-dc-surface shadow-xs ring-1 ring-[color:var(--dc-edge)]">
          <div className="-mb-3 px-4 pt-3">
            <Headless.CloseButton as={NavbarItem} aria-label="Close navigation">
              <CloseMenuIcon />
            </Headless.CloseButton>
          </div>
          {children}
        </div>
      </Headless.DialogPanel>
    </Headless.Dialog>
  )
}

export function SidebarLayout({
  navbar,
  sidebar,
  children,
}: React.PropsWithChildren<{ navbar: React.ReactNode; sidebar: React.ReactNode }>) {
  const [showSidebar, setShowSidebar] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_W)
  const [isResizing, setIsResizing] = useState(false)

  // Sync persisted state after mount (avoids SSR mismatch)
  useEffect(() => {
    if (localStorage.getItem('sidebar-collapsed') === 'true') setCollapsed(true)
    const saved = Number(localStorage.getItem('sidebar-width'))
    if (saved >= SIDEBAR_MIN_W && saved <= SIDEBAR_MAX_W) setSidebarWidth(saved)
  }, [])

  const toggle = () => {
    setCollapsed((c: boolean) => {
      const next = !c
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = sidebarWidth
    let currentW = startW

    setIsResizing(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (me: MouseEvent) => {
      currentW = Math.min(SIDEBAR_MAX_W, Math.max(SIDEBAR_MIN_W, startW + me.clientX - startX))
      setSidebarWidth(currentW)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setIsResizing(false)
      localStorage.setItem('sidebar-width', String(currentW))
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [sidebarWidth])

  const expandedW = sidebarWidth
  const currentW  = collapsed ? SIDEBAR_COLLAPSED_W : expandedW

  return (
    <SidebarCollapsedContext.Provider value={{ collapsed, toggle }}>
      <div className="relative isolate flex min-h-svh w-full bg-dc-surface max-lg:flex-col lg:bg-dc-bg">
        {/* Desktop sidebar */}
        <div
          style={{ width: currentW }}
          className={clsx(
            'fixed inset-y-0 left-0 max-lg:hidden overflow-hidden',
            !isResizing && 'transition-[width] duration-200 ease-in-out',
          )}
        >
          {sidebar}

          {/* Drag handle — only shown when expanded */}
          {!collapsed && (
            <div
              onMouseDown={handleResizeStart}
              className="absolute inset-y-0 right-0 w-1 cursor-col-resize group"
              aria-hidden
            >
              <div className="h-full w-px bg-transparent transition-colors group-hover:bg-[color:var(--color-brand)]/40" />
            </div>
          )}
        </div>

        {/* Mobile sidebar */}
        <MobileSidebar open={showSidebar} close={() => setShowSidebar(false)}>
          {sidebar}
        </MobileSidebar>

        {/* Mobile navbar */}
        <header className="flex items-center px-4 lg:hidden">
          <div className="py-2.5">
            <NavbarItem onClick={() => setShowSidebar(true)} aria-label="Open navigation">
              <OpenMenuIcon />
            </NavbarItem>
          </div>
          <div className="min-w-0 flex-1">{navbar}</div>
        </header>

        {/* Main content */}
        <main
          style={{ paddingLeft: currentW }}
          className={clsx(
            'flex flex-1 flex-col pb-2 lg:min-w-0 lg:pt-2 lg:pr-2',
            !isResizing && 'transition-[padding-left] duration-200 ease-in-out',
          )}
        >
          <div className="grow p-6 lg:rounded-lg lg:bg-dc-surface lg:p-10 lg:shadow-xs lg:ring-1 lg:ring-[color:var(--dc-edge)]">
            <div className="mx-auto max-w-6xl">{children}</div>
          </div>
        </main>
      </div>
    </SidebarCollapsedContext.Provider>
  )
}
