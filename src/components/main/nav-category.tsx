"use client"

import { TextAlignStart } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useState } from "react"
import { Link } from "@/i18n/navigation"
import { Category } from "@/types/api/Category"

export function NavCategory() {
  const { isMobile } = useSidebar()

  const [categories, setCategories] = useState<Category[]>([
    {
      id: "1",
      name: "资源中心",
    },
    {
      id: "2",
      name: "开发调优",
    },
    {
      id: "3",
      name: "聊天灌水",
    },
  ])

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>类别</SidebarGroupLabel>
      <SidebarMenu>
        {categories.map((category) => (
          <SidebarMenuItem key={category.id}>
            <SidebarMenuButton asChild>
              <Link href={`/category/${category.id}`}>
                <TextAlignStart />
                <span>{category.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
