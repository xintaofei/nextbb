"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { NavTop } from "@/components/main/nav-top"
import { SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MobileSidebarTrigger({ className }: { className?: string }) {
  return (
    <div className="md:hidden sticky top-0 z-30 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60 border-b">
      <div className="h-14 flex items-center justify-between px-4">
        <SidebarTrigger className={className} />
        <div className="flex-1 flex justify-center">
          <NavTop width={96} height={24} />
        </div>
        <Button variant="ghost" size="icon" className="size-7">
          <SearchIcon className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>
      </div>
    </div>
  )
}
