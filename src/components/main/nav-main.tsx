import { Edit } from "lucide-react"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Link } from "@/i18n/navigation"

export function NavMain() {
  return (
    <SidebarGroup>
      <SidebarMenu>
        <Link href="/">
          <SidebarMenuButton>
            <Edit />
            <span>话题</span>
          </SidebarMenuButton>
        </Link>
        <Link href="/user/activity">
          <SidebarMenuButton>
            <Edit />
            <span>我的帖子</span>
          </SidebarMenuButton>
        </Link>
        <Link href="/user/messages">
          <SidebarMenuButton>
            <Edit />
            <span>我的消息</span>
          </SidebarMenuButton>
        </Link>
      </SidebarMenu>
    </SidebarGroup>
  )
}
