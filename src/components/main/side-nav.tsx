"use client"

import { SideNavContent } from "@/components/main/side-nav-content"

export function SideNav() {
  return (
    <aside className="hidden sm:flex flex-col sticky top-0 h-screen bg-background w-20 xl:w-64 transition-[width] duration-300 z-30 shrink-0">
      <SideNavContent mode="desktop" />
    </aside>
  )
}
