"use client"

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
import { Category } from "@/types/api/category"
import {
  Bug,
  CodeXml,
  FileSliders,
  HeartPlus,
  HousePlug,
  Megaphone,
  MessageCircleHeart,
  Palette,
  Smile,
  SquareFunction,
} from "lucide-react"

export function NavCategory() {
  const { isMobile } = useSidebar()

  const [categories, setCategories] = useState<Category[]>([
    {
      id: "1",
      name: "文档",
      icon: FileSliders,
    },
    {
      id: "2",
      name: "支持",
      icon: HeartPlus,
    },
    {
      id: "9",
      name: "公告",
      icon: Megaphone,
    },
    {
      id: "3",
      name: "聊天灌水",
      icon: MessageCircleHeart,
    },
    {
      id: "4",
      name: "插件",
      icon: HousePlug,
    },
    {
      id: "5",
      name: "功能",
      icon: SquareFunction,
    },
    {
      id: "6",
      name: "用户体验",
      icon: Smile,
    },
    {
      id: "7",
      name: "错误",
      icon: Bug,
    },
    {
      id: "8",
      name: "主题组件",
      icon: Palette,
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
                {category.icon && <category.icon />}
                <span>{category.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
