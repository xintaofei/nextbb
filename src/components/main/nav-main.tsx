import {
  AlignStartHorizontal,
  BookUser,
  ChevronRight,
  EllipsisVertical,
  FolderOpenDot,
  Inbox,
  Layers,
} from "lucide-react"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import Link from "next/link"

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
        <Link href="#">
          <SidebarMenuButton>
            <BookUser />
            <span>我的帖子</span>
          </SidebarMenuButton>
        </Link>
        <Link href="#">
          <SidebarMenuButton>
            <Inbox />
            <span>我的消息</span>
          </SidebarMenuButton>
        </Link>
        <Link href="#">
          <SidebarMenuButton>
            <AlignStartHorizontal />
            <span>排行榜</span>
          </SidebarMenuButton>
        </Link>
        <Collapsible asChild defaultOpen={false} className="group/collapsible">
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="x">
                <FolderOpenDot />
                <span>共享资源</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton asChild>
                    <span>sub1</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
        <Collapsible asChild defaultOpen={false} className="group/collapsible">
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="x">
                <EllipsisVertical />
                <span>更多</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton asChild>
                    <span>sub1</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  )
}
