"use client"

import { useMemo } from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
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
  const pathname = usePathname()

  const username = useMemo(() => {
    if (!data) return null
    return data.profile?.username || null
  }, [data])

  const encodedUsername = username ? encodeUsername(username) : null

  const items = [
    {
      title: t("topics"),
      url: "/",
      icon: Layers,
      isActive: pathname === "/",
    },
    {
      title: t("myPosts"),
      url: encodedUsername ? `/u/${encodedUsername}/activity/posts` : "/login",
      icon: BookUser,
      isActive: pathname.startsWith(
        encodedUsername ? `/u/${encodedUsername}/activity/posts` : "/login"
      ),
    },
    {
      title: t("myMessages"),
      url: encodedUsername ? `/u/${encodedUsername}/notifications` : "/login",
      icon: Inbox,
      isActive: pathname.startsWith(
        encodedUsername ? `/u/${encodedUsername}/notifications` : "/login"
      ),
    },
    {
      title: t("checkin"),
      url: "/checkin",
      icon: CalendarCheck,
      isActive: pathname === "/checkin",
    },
    {
      title: t("donation"),
      url: "/donation/month",
      icon: Heart,
      isActive: pathname.startsWith("/donation"),
    },
    {
      title: t("leaderboard"),
      url: "/leaderboard",
      icon: ChartColumn,
      isActive: pathname === "/leaderboard",
    },
  ]

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <Link key={item.url} href={item.url}>
            <SidebarMenuButton isActive={item.isActive}>
              <item.icon />
              <span>{item.title}</span>
            </SidebarMenuButton>
          </Link>
        ))}
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
