"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { NavTop } from "@/components/main/nav-top"
import { NavUser } from "@/components/main/nav-user"
import { SideNavContent } from "@/components/main/side-nav-content"

export function MobileHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sm:hidden sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 justify-between">
        {/* Left: Menu Trigger */}
        <div className="w-10 flex justify-start">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle sidebar</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px]">
              <SideNavContent
                mode="mobile"
                onLinkClick={() => setOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>

        {/* Center: Logo */}
        <div className="flex-1 flex justify-center">
          <NavTop width={28} />
        </div>

        {/* Right: User Avatar Trigger */}
        <div className="w-10 flex justify-end">
          <NavUser layout="icon" />
        </div>
      </div>
    </header>
  )
}
