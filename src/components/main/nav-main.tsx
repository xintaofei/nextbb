"use client"

import { useMemo } from "react"
import useSWR from "swr"
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
import { encodeUsername } from "@/lib/utils"

type MeResponse = {
  user: {
    id: string
    email?: string | null
    isAdmin: boolean
  }
  profile?: {
    id: string
    email: string
    username: string
    avatar?: string | null
  } | null
}

const fetcher = async (url: string): Promise<MeResponse | null> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return null
  return res.json()
}

export function NavMain() {
  const { data } = useSWR<MeResponse | null>("/api/auth/me", fetcher)

  const username = useMemo(() => {
    if (!data) return null
    return data.profile?.username || null
  }, [data])

  const encodedUsername = username ? encodeUsername(username) : null

  return (
    <SidebarGroup>
      <SidebarMenu>
        <Link href="/">
          <SidebarMenuButton>
            <Layers />
            <span>话题</span>
          </SidebarMenuButton>
        </Link>
        <Link
          href={
            encodedUsername ? `/u/${encodedUsername}/activity/posts` : "/login"
          }
        >
          <SidebarMenuButton>
            <BookUser />
            <span>我的帖子</span>
          </SidebarMenuButton>
        </Link>
        <Link
          href={
            encodedUsername ? `/u/${encodedUsername}/notifications` : "/login"
          }
        >
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
