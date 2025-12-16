"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import useSWR from "swr"
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ThemeSwitcher } from "@/components/common/theme-switcher"
import { LocaleSwitcher } from "@/components/common/locale-switcher"

type MeProfile = {
  id: string
  email: string
  username: string
  avatar?: string | null
}

type MeUser = {
  id: string
  email?: string | null
}

type MeResponse = {
  user: MeUser
  profile?: MeProfile | null
}

const fetcher = async (url: string): Promise<MeResponse | null> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return null
  return res.json()
}

export function NavUser() {
  const { isMobile } = useSidebar()
  const locale = useLocale()
  const router = useRouter()

  const { data, isLoading, mutate } = useSWR<MeResponse | null>(
    "/api/auth/me",
    fetcher
  )

  const displayName = useMemo(() => {
    if (!data) return "未登录"
    return data.profile?.username || data.user.email || "未登录"
  }, [data])

  const displayEmail = useMemo(() => {
    if (!data) return ""
    return data.user.email || ""
  }, [data])

  const displayAvatar = useMemo(() => {
    if (!data) return ""
    return data.profile?.avatar || ""
  }, [data])

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    await mutate()
    router.replace(`/${locale}`)
  }

  const goLogin = () => {
    router.push(`/${locale}/login`)
  }

  const goRegister = () => {
    router.push(`/${locale}/register`)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={displayAvatar} alt={displayName} />
                <AvatarFallback className="rounded-lg">
                  {displayName.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {isLoading ? "加载中..." : displayName}
                </span>
                <span className="truncate text-xs">{displayEmail}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={displayAvatar} alt={displayName} />
                  <AvatarFallback className="rounded-lg">
                    {displayName.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs">{displayEmail}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <div className="flex items-center gap-2 px-2 py-2">
              <ThemeSwitcher />
              <LocaleSwitcher />
            </div>
            <DropdownMenuSeparator />
            {!data ? (
              <>
                <DropdownMenuItem onSelect={goLogin}>登录</DropdownMenuItem>
                <DropdownMenuItem onSelect={goRegister}>注册</DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onSelect={onLogout}>
                <LogOut />
                Log out
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
