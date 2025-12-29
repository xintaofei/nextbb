"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Settings, Shield } from "lucide-react"
import Link from "next/link"
import { encodeUsername } from "@/lib/utils"
import { useTranslations } from "next-intl"

type UserInfoHeaderProps = {
  user: {
    id: bigint
    name: string
    avatar: string
    email: string
    status: number
    is_admin: boolean
    created_at: Date
  }
  statistics: {
    topicsCount: number
    postsCount: number
    likesReceived: number
    bookmarksCount: number
    badgesCount: number
    credits: number
  }
  isOwnProfile: boolean
  isAdmin: boolean
}

export function UserInfoHeader({
  user,
  statistics,
  isOwnProfile,
  isAdmin,
}: UserInfoHeaderProps) {
  const t = useTranslations("User.profile")

  return (
    <div className="w-full border-b bg-background">
      <div className="max-w-5xl mx-auto pb-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-6">
          {/* 头像 */}
          <Avatar className="h-24 w-24 md:h-32 md:w-32 shrink-0 mx-auto md:mx-0">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-2xl md:text-4xl">
              {user.name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* 基本信息 */}
          <div className="flex flex-col items-center md:items-start gap-2 md:flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold">{user.name}</h1>
              {user.is_admin && <Shield className="h-5 w-5 text-orange-500" />}
            </div>

            <div className="text-sm text-muted-foreground text-center md:text-left">
              {t("joinedAt")}{" "}
              {new Date(user.created_at).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 mt-2">
              {isOwnProfile && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/u/${encodeUsername(user.name)}/preferences`}>
                    <Settings className="h-4 w-4 mr-1" />
                    {t("actions.edit")}
                  </Link>
                </Button>
              )}
              {isAdmin && !isOwnProfile && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/users">
                    <Shield className="h-4 w-4 mr-1" />
                    {t("actions.manage")}
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-6 gap-2 md:gap-6 lg:gap-12 md:shrink-0 w-full md:w-auto">
            <div className="text-center">
              <div className="text-lg md:text-2xl font-bold">
                {statistics.topicsCount}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                {t("statistics.topics")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg md:text-2xl font-bold">
                {statistics.postsCount}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                {t("statistics.posts")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg md:text-2xl font-bold">
                {statistics.likesReceived}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                {t("statistics.likes")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg md:text-2xl font-bold">
                {statistics.bookmarksCount}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                {t("statistics.bookmarks")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg md:text-2xl font-bold">
                {statistics.badgesCount}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                {t("statistics.badges")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg md:text-2xl font-bold">
                {statistics.credits}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                {t("statistics.credits")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
