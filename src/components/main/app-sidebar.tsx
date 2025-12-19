import * as React from "react"
import { prisma } from "@/lib/prisma"

import { NavMain } from "@/components/main/nav-main"
import { NavCategory } from "@/components/main/nav-category"
import { NavUser } from "@/components/main/nav-user"
import { NavTop } from "@/components/main/nav-top"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const categories = await prisma.categories.findMany({
    where: { is_deleted: false },
    select: { id: true, name: true, icon: true },
    orderBy: { updated_at: "desc" },
  })

  const categoryItems = categories.map((c) => ({
    id: String(c.id),
    name: c.name,
    icon: c.icon ?? "📁",
  }))

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <NavTop />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <NavCategory categories={categoryItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
