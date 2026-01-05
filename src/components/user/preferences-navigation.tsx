"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { encodeUsername } from "@/lib/utils"
import { User, Shield, Palette, Bell, Lock } from "lucide-react"
import { useTranslations } from "next-intl"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type PreferencesNavigationProps = {
  username: string
}

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  value: string
}

export function PreferencesNavigation({
  username,
}: PreferencesNavigationProps) {
  const pathname = usePathname()
  const encodedUsername = encodeUsername(username)
  const t = useTranslations("User.preferences")

  const navItems: NavItem[] = [
    {
      label: t("account.title"),
      href: `/u/${encodedUsername}/preferences/account`,
      icon: User,
      value: "account",
    },
    {
      label: t("security.title"),
      href: `/u/${encodedUsername}/preferences/security`,
      icon: Shield,
      value: "security",
    },
    {
      label: t("interface.title"),
      href: `/u/${encodedUsername}/preferences/interface`,
      icon: Palette,
      value: "interface",
    },
    {
      label: t("notifications.title"),
      href: `/u/${encodedUsername}/preferences/notifications`,
      icon: Bell,
      value: "notifications",
    },
    {
      label: t("privacy.title"),
      href: `/u/${encodedUsername}/preferences/privacy`,
      icon: Lock,
      value: "privacy",
    },
  ]

  // 确定当前激活的 tab
  const activeValue =
    navItems.find((item) => pathname === item.href)?.value || "account"

  return (
    <Tabs value={activeValue} className="w-full">
      <TabsList className="grid w-full grid-cols-5 max-sm:grid-cols-3 gap-2 h-auto">
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
