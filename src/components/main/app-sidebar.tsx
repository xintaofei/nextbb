import * as React from "react"
import { prisma } from "@/lib/prisma"
import { getLocale } from "next-intl/server"
import { getTranslationsQuery, getTranslationField } from "@/lib/locale"

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
  const locale = await getLocale()

  const categories = await prisma.categories.findMany({
    where: { is_deleted: false },
    select: {
      id: true,
      icon: true,
      translations: getTranslationsQuery(locale, { name: true }),
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
    icon: string
    translations: {
      locale: string
      name: string
      is_source: boolean
    }[]
    _count: {
      topics: number
    }
  }

  const categoryItems = categories.map((c: CategoryRow) => ({
    id: String(c.id),
    name: getTranslationField(c.translations, locale, "name", ""),
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
