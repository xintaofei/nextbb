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
    select: {
      id: true,
      name: true,
      icon: true,
      _count: {
        select: {
          topics: {
            where: { is_deleted: false },
          },
        },
      },
    },
    orderBy: [{ sort: "asc" }, { updated_at: "desc" }],
  })

  interface CategoryRow {
    id: bigint
    name: string
    icon: string
    _count: {
      topics: number
    }
  }

  const categoryItems = categories.map((c: CategoryRow) => ({
    id: String(c.id),
    name: c.name,
    icon: c.icon ?? "📁",
    topicCount: c._count.topics,
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
