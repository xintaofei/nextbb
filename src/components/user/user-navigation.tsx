"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn, encodeUsername } from "@/lib/utils"
import { Activity, Award, Bell, Settings, User, Users } from "lucide-react"
import { useTranslations } from "next-intl"

type UserNavigationProps = {
  username: string
  isOwnProfile: boolean
}

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  requiresAuth: boolean
}

export function UserNavigation({
  username,
  isOwnProfile,
}: UserNavigationProps) {
  const pathname = usePathname()
  const encodedUsername = encodeUsername(username)
  const t = useTranslations("User.profile")

  const navItems: NavItem[] = [
    {
      label: t("overview.title"),
      href: `/u/${encodedUsername}`,
      icon: User,
      requiresAuth: false,
    },
    {
      label: t("activity.title"),
      href: `/u/${encodedUsername}/activity`,
      icon: Activity,
      requiresAuth: false,
    },
    {
      label: t("badges"),
      href: `/u/${encodedUsername}/badges`,
      icon: Award,
      requiresAuth: false,
    },
    {
      label: t("follows.title"),
      href: `/u/${encodedUsername}/follows`,
      icon: Users,
      requiresAuth: false,
    },
    {
      label: t("notifications"),
      href: `/u/${encodedUsername}/notifications`,
      icon: Bell,
      requiresAuth: true,
    },
    {
      label: t("preferences"),
      href: `/u/${encodedUsername}/preferences`,
      icon: Settings,
      requiresAuth: true,
    },
  ]

  // 过滤需要身份验证的导航项
  const visibleNavItems = navItems.filter(
    (item) => !item.requiresAuth || isOwnProfile
  )

  return (
    <div className="w-full border-b bg-background">
      <div className="max-w-5xl mx-auto">
        <nav className="flex gap-1 overflow-x-auto scrollbar-hide">
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href !== `/u/${encodedUsername}` &&
                pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 p-4 text-sm font-medium transition-colors whitespace-nowrap",
                  "border-b-2 border-transparent hover:text-foreground",
                  isActive
                    ? "border-primary text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
