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
}

export function NavMain({ className, onLinkClick }: NavMainProps) {
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

  return (
    <nav className={cn("flex flex-col", className)}>
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.url}
          onClick={onLinkClick}
          title={item.title}
          className="hover:[&_div]:bg-accent dark:hover:[&_div]:bg-accent/50"
        >
          <div
            className={cn(
              buttonVariants({
                variant: "ghost",
                size: "lg",
              }),
              item.isActive && "bg-accent dark:bg-accent/50 font-bold",
              "py-6 w-fit rounded-full gap-4"
            )}
          >
            <item.icon className="size-5" />
            <span className="text-lg">{item.title}</span>
          </div>
        </Link>
      ))}
    </nav>
  )
}
