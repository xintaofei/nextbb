"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { signOut } from "next-auth/react"
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Settings,
  TicketCheck,
  User,
  Activity,
  MoreHorizontal,
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
import Link from "next/link"
import { ThemeSwitcher } from "@/components/common/theme-switcher"
import { LocaleSwitcher } from "@/components/common/locale-switcher"
import { cn, encodeUsername } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useCurrentUser } from "@/hooks/use-current-user"

interface NavUserProps {
  onLinkClick?: () => void
  layout?: "sidebar" | "drawer" | "bottom" | "icon"
}

export function NavUser({ onLinkClick, layout = "sidebar" }: NavUserProps) {
  const tAdmin = useTranslations("Admin")
  const tNav = useTranslations("Nav.user")
  const tCommon = useTranslations("Common")
  const tAuth = useTranslations("Auth")
  const router = useRouter()

  const { user, isLoading } = useCurrentUser()

  const displayName = useMemo(() => {
    if (!user) return tNav("notLoggedIn")
    return user.name || user.email || tNav("notLoggedIn")
  }, [user, tNav])

  const displayEmail = useMemo(() => {
    if (!user) return ""
    return user.email || ""
  }, [user])

  const displayAvatar = useMemo(() => {
    if (!user) return undefined
    return user.avatar || undefined
  }, [user])

  const encodedUsername = useMemo(() => {
    if (!user?.name) return null
    return encodeUsername(user.name)
  }, [user])

  const onLogout = async () => {
    await signOut({ redirect: false })
    router.replace(`/`)
  }

  const isSidebar = layout === "sidebar"
  const isIcon = layout === "icon"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {isIcon ? (
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8 rounded-full">
              <AvatarImage src={displayAvatar} alt={displayName} />
              <AvatarFallback className="rounded-full">
                {displayName.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        ) : (
          <Button
            variant="ghost"
            className={cn(
              "h-auto w-full gap-2 p-3 rounded-full",
              isSidebar && "justify-center xl:justify-start",
              !isSidebar && "justify-start"
            )}
          >
            <Avatar className="h-8 w-8 rounded-full">
              <AvatarImage src={displayAvatar} alt={displayName} />
              <AvatarFallback className="rounded-full">
                {displayName.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Show text only in full sidebar or drawer */}
            <div
              className={cn(
                "grid flex-1 text-left text-sm leading-tight",
                isSidebar ? "hidden xl:grid" : "grid"
              )}
            >
              <span className="truncate font-bold">
                {isLoading ? tCommon("Loading.loading") : "@" + displayName}
              </span>
            </div>
            <MoreHorizontal
              className={cn(
                "ml-auto size-4",
                isSidebar ? "hidden xl:block" : "block"
              )}
            />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-xl"
        side={layout === "bottom" ? "bottom" : "top"}
        align={layout === "bottom" || layout === "icon" ? "end" : "center"}
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-full">
              <AvatarImage src={displayAvatar} alt={displayName} />
              <AvatarFallback className="rounded-full">
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
        {user && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link
                  href={encodedUsername ? `/u/${encodedUsername}` : "/login"}
                  onClick={onLinkClick}
                >
                  <User className="mr-2 h-4 w-4" />
                  {tNav("profile")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={
                    encodedUsername
                      ? `/u/${encodedUsername}/activity`
                      : "/login"
                  }
                  onClick={onLinkClick}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  {tNav("activity")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={
                    encodedUsername
                      ? `/u/${encodedUsername}/notifications`
                      : "/login"
                  }
                  onClick={onLinkClick}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  {tNav("notifications")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={
                    encodedUsername
                      ? `/u/${encodedUsername}/invitations`
                      : "/login"
                  }
                  onClick={onLinkClick}
                >
                  <TicketCheck className="mr-2 h-4 w-4" />
                  {tNav("invitations")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={
                    encodedUsername
                      ? `/u/${encodedUsername}/preferences`
                      : "/login"
                  }
                  onClick={onLinkClick}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {tNav("settings")}
                </Link>
              </DropdownMenuItem>
              {user?.isAdmin ? (
                <DropdownMenuItem asChild>
                  <Link href="/admin" target="_blank" onClick={onLinkClick}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {tAdmin("entry")}
                  </Link>
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <div className="flex items-center gap-2 px-2 py-2">
          <ThemeSwitcher />
          <LocaleSwitcher />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {!user ? (
            <>
              <DropdownMenuItem asChild>
                <Link href="/login" onClick={onLinkClick}>
                  {tAuth("Login.title")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/register" onClick={onLinkClick}>
                  {tAuth("Register.title")}
                </Link>
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onSelect={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              {tNav("logout")}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
