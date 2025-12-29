"use client"

import { ReactNode, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import useSWR from "swr"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { UserBadgesDisplay } from "@/components/common/user-badges-display"
import { useIsMobile } from "@/hooks/use-mobile"
import { encodeUsername } from "@/lib/utils"
import { Shield } from "lucide-react"

type BadgeItem = {
  id: string
  name: string
  icon: string
  level: number
  bgColor: string | null
  textColor: string | null
  description?: string | null
}

type BadgeListResponse = {
  items: BadgeItem[]
}

type UserInfoCardProps = {
  userId: string
  userName: string
  userAvatar: string
  children: ReactNode
  isAdmin?: boolean
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  showStatistics?: boolean // 预留，未来用于显示统计数据
}

export function UserInfoCard({
  userId,
  userName,
  userAvatar,
  children,
  isAdmin = false,
  side = "right",
  align = "center",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showStatistics: _showStatistics = false,
}: UserInfoCardProps) {
  const t = useTranslations("UserCard")
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  // 使用 SWR 获取徽章数据，仅在卡片打开时才请求
  const { data: badgesData, isLoading: badgesLoading } =
    useSWR<BadgeListResponse>(open ? `/api/users/${userId}/badges` : null, {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5分钟缓存
    })

  const badges = badgesData?.items || []
  const maxBadgeDisplay = isMobile ? 2 : 3

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className="w-80 max-sm:w-70 p-0 overflow-hidden"
      >
        <div className="flex flex-col gap-4 p-4">
          {/* 头像区域 */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-linear-to-br from-primary to-accent opacity-20 blur-sm" />
              <Avatar className="h-16 w-16 max-sm:h-14 max-sm:w-14 relative border-2 border-primary/30">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className="text-xl max-sm:text-lg">
                  {userName.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* 用户信息区域 */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg max-sm:text-base font-semibold">
                {userName}
              </h3>
              {isAdmin && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  {t("admin")}
                </Badge>
              )}
            </div>
          </div>

          {/* 徽章展示区域 */}
          {badgesLoading ? (
            <div className="flex justify-center gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          ) : badges.length > 0 ? (
            <div className="flex justify-center">
              <UserBadgesDisplay
                badges={badges}
                maxDisplay={maxBadgeDisplay}
                size="sm"
              />
            </div>
          ) : null}

          {/* 操作按钮区域 */}
          <div className="flex justify-center pt-2 border-t">
            <Link
              href={`/u/${encodeUsername(userName)}`}
              onClick={() => setOpen(false)}
            >
              <Button className="w-full" size="sm">
                {t("viewProfile")}
              </Button>
            </Link>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
