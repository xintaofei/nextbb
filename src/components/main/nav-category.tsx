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
import { Badge } from "../ui/badge"

type CategoryItem = {
  id: string
  name: string
  icon?: string
  topicCount: number
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
              <Link href={`/c/${category.id}`}>
                <span>{category.icon ?? "📁"}</span>
                <span>{category.name}</span>
                <Badge
                  className="ml-auto text-xs text-muted-foreground h-5 min-w-5 rounded-full px-1 font-mono tabular-nums"
                  variant="outline"
                  title="Topic count"
                >
                  {category.topicCount}
                </Badge>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
