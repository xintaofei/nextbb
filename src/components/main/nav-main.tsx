"use client"

import { useMemo } from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import {
  BookUser,
  CalendarCheck,
  ChartColumn,
  Heart,
  Inbox,
  Layers,
} from "lucide-react"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"
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
  const { isMobile, setOpenMobile } = useSidebar()

  const username = useMemo(() => {
    if (!data) return null
    return data.profile?.username || null
  }, [data])

  const encodedUsername = username ? encodeUsername(username) : null

  const items = [
    {
      id: "topics",
      title: t("topics"),
      url: "/",
      icon: Layers,
      isActive: pathname === "/",
    },
    {
      id: "myPosts",
      title: t("myPosts"),
      url: encodedUsername ? `/u/${encodedUsername}/activity/posts` : "/login",
      icon: BookUser,
      isActive: pathname.startsWith(
        encodedUsername ? `/u/${encodedUsername}/activity/posts` : "/login"
      ),
    },
    {
      id: "myMessages",
      title: t("myMessages"),
      url: encodedUsername ? `/u/${encodedUsername}/notifications` : "/login",
      icon: Inbox,
      isActive: pathname.startsWith(
        encodedUsername ? `/u/${encodedUsername}/notifications` : "/login"
      ),
    },
    {
      id: "checkin",
      title: t("checkin"),
      url: "/checkin",
      icon: CalendarCheck,
      isActive: pathname === "/checkin",
    },
    {
      id: "donation",
      title: t("donation"),
      url: "/donation/month",
      icon: Heart,
      isActive: pathname.startsWith("/donation"),
    },
    {
      id: "leaderboard",
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
          <Link
            key={item.id}
            href={item.url}
            onClick={() => {
              if (isMobile) setOpenMobile(false)
            }}
          >
            <SidebarMenuButton isActive={item.isActive}>
              <item.icon />
              <span>{item.title}</span>
            </SidebarMenuButton>
          </Link>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
