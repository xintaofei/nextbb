"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { encodeUsername } from "@/lib/utils"
import { Bell, AtSign, Reply, Heart, Award, ShieldAlert } from "lucide-react"
import { useTranslations } from "next-intl"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type NotificationsNavigationProps = {
  username: string
}

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  value: string
}

export function NotificationsNavigation({
  username,
}: NotificationsNavigationProps) {
  const pathname = usePathname()
  const encodedUsername = encodeUsername(username)
  const t = useTranslations("User.notifications.nav")

  const navItems: NavItem[] = [
    {
      label: t("all"),
      href: `/u/${encodedUsername}/notifications`,
      icon: Bell,
      value: "all",
    },
    {
      label: t("mentions"),
      href: `/u/${encodedUsername}/notifications/mentions`,
      icon: AtSign,
      value: "mentions",
    },
    {
      label: t("replies"),
      href: `/u/${encodedUsername}/notifications/replies`,
      icon: Reply,
      value: "replies",
    },
    {
      label: t("likes"),
      href: `/u/${encodedUsername}/notifications/likes`,
      icon: Heart,
      value: "likes",
    },
    {
      label: t("awards"),
      href: `/u/${encodedUsername}/notifications/awards`,
      icon: Award,
      value: "awards",
    },
    {
      label: t("system"),
      href: `/u/${encodedUsername}/notifications/system`,
      icon: ShieldAlert,
      value: "system",
    },
  ]

  // 确定当前激活的 tab
  const activeItem =
    navItems.find((item) => pathname === item.href) || navItems[0]
  const activeValue = activeItem.value

  return (
    <Tabs value={activeValue} className="w-full">
      <TabsList className="grid w-full grid-cols-6 max-sm:grid-cols-3 gap-2 h-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <TabsTrigger key={item.value} value={item.value} asChild>
              <Link href={item.href}>
                <Icon className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
