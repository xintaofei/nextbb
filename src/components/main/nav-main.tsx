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
import Link from "next/link"
import { cn, encodeUsername } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

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

interface NavMainProps {
  className?: string
  onLinkClick?: () => void
  layout?: "sidebar" | "drawer" | "bottom"
}

export function NavMain({
  className,
  onLinkClick,
  layout = "sidebar",
}: NavMainProps) {
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

  const isBottom = layout === "bottom"
  const isSidebar = layout === "sidebar"

  return (
    <nav
      className={cn(
        isBottom
          ? "flex flex-row justify-around items-center w-full"
          : "flex flex-col gap-2",
        className
      )}
    >
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.url}
          onClick={onLinkClick}
          className={cn(
            buttonVariants({
              variant: "ghost",
              size: isBottom ? "default" : "lg",
            }),
            isBottom && "flex-col gap-1 h-auto px-2 py-2 rounded-none flex-1",
            isSidebar && "justify-center xl:justify-start px-2 xl:px-4",
            !isBottom && !isSidebar && "justify-start px-4", // drawer
            item.isActive && "bg-accent font-bold"
            // X.com style active state: bold icon/text, maybe no bg? kept bg for now
          )}
          title={isSidebar ? item.title : undefined}
        >
          <item.icon className={cn("h-6 w-6", isBottom && "h-5 w-5")} />
          <span
            className={cn(
              "text-xl",
              isSidebar && "hidden xl:inline",
              isBottom && "text-[10px] font-normal leading-none"
            )}
          >
            {item.title}
          </span>
        </Link>
      ))}
    </nav>
  )
}
