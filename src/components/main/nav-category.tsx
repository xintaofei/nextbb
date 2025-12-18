"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useState } from "react"
import Link from "next/link"

export function NavCategory() {
  const [categories] = useState([
    {
      id: "1",
      name: "文档",
      icon: "🌟",
    },
    {
      id: "2",
      name: "支持",
      icon: "🌟",
    },
    {
      id: "9",
      name: "公告",
      icon: "🌟",
    },
    {
      id: "3",
      name: "聊天灌水",
      icon: "🌟",
    },
    {
      id: "4",
      name: "插件",
      icon: "🌟",
    },
    {
      id: "5",
      name: "功能",
      icon: "🌟",
    },
    {
      id: "6",
      name: "用户体验",
      icon: "🌟",
    },
    {
      id: "7",
      name: "错误",
      icon: "🌟",
    },
    {
      id: "8",
      name: "主题组件",
      icon: "🌟",
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
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
