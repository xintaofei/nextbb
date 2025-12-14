import * as React from "react"

import { NavMain } from "@/components/main/nav-main"
import { NavCategory } from "@/components/main/nav-category"
import { NavUser } from "@/components/main/nav-user"
import { NavTop } from "@/components/main/nav-top"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <NavTop />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <NavCategory />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
