import { BookUser, Inbox, Layers } from "lucide-react"

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
            <Layers />
            <span>话题</span>
          </SidebarMenuButton>
        </Link>
        <Link href="/user/activity">
          <SidebarMenuButton>
            <BookUser />
            <span>我的帖子</span>
          </SidebarMenuButton>
        </Link>
        <Link href="/user/messages">
          <SidebarMenuButton>
            <Inbox />
            <span>我的消息</span>
          </SidebarMenuButton>
        </Link>
      </SidebarMenu>
    </SidebarGroup>
  )
}
