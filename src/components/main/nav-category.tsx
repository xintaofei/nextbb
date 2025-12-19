"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { useTranslations } from "next-intl"

type CategoryItem = {
  id: string
  name: string
  icon?: string
}

export function NavCategory({ categories }: { categories: CategoryItem[] }) {
  const tCommon = useTranslations("Common")

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{tCommon("Tabs.categories")}</SidebarGroupLabel>
      <SidebarMenu>
        {categories.map((category) => (
          <SidebarMenuItem key={category.id}>
            <SidebarMenuButton asChild>
              <Link href={`/category/${category.id}`}>
                <span>{category.icon ?? "📁"}</span>
                <span>{category.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
