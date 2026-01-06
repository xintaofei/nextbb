"use client"

import { useMemo } from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import {
  BookUser,
  CalendarCheck,
  ChartColumn,
  ChevronRight,
  EllipsisVertical,
  FolderOpenDot,
  Heart,
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
    credits: number
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
  const t = useTranslations("Nav.main")

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
            <span>{t("topics")}</span>
          </SidebarMenuButton>
        </Link>
        <Link
          href={
            encodedUsername ? `/u/${encodedUsername}/activity/posts` : "/login"
          }
        >
          <SidebarMenuButton>
            <BookUser />
            <span>{t("myPosts")}</span>
          </SidebarMenuButton>
        </Link>
        <Link
          href={
            encodedUsername ? `/u/${encodedUsername}/notifications` : "/login"
          }
        >
          <SidebarMenuButton>
            <Inbox />
            <span>{t("myMessages")}</span>
          </SidebarMenuButton>
        </Link>
        <Link href="/checkin">
          <SidebarMenuButton>
            <CalendarCheck />
            <span>{t("checkin")}</span>
          </SidebarMenuButton>
        </Link>
        <Link href="/donation">
          <SidebarMenuButton>
            <Heart />
            <span>{t("donation")}</span>
          </SidebarMenuButton>
        </Link>
        <Link href="/leaderboard">
          <SidebarMenuButton>
            <ChartColumn />
            <span>{t("leaderboard")}</span>
          </SidebarMenuButton>
        </Link>
        <Collapsible asChild defaultOpen={false} className="group/collapsible">
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="x">
                <FolderOpenDot />
                <span>{t("sharedResources")}</span>
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
                <span>{t("more")}</span>
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
