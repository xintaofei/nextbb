"use client"

import { ReactNode, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useSession } from "next-auth/react"
import useSWR, { mutate } from "swr"
import { toast } from "sonner"
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
import {
  Shield,
  MessageCircle,
  UserPlus,
  UserCheck,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Cake,
} from "lucide-react"

type UserProfile = {
  name?: string
  avatar?: string
  bio: string | null
  website: string | null
  location: string | null
  birthday: string | null
  customStatus?: {
    emoji: string | null
    statusText: string
  } | null
}

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

type CreateConversationPayload = {
  type: "DM"
  targetUserId: string
}

type CreateConversationResponse = {
  conversation?: {
    id: string
  }
  conversationId?: string
  id?: string
}

type UserStatistics = {
  topicsCount: number
  postsCount: number
  likesReceived: number
  followersCount: number
  credits: number
  joinedAt: string
}

type UserInfoCardProps = {
  userId: string
  userName?: string
  userAvatar?: string
  children: ReactNode
  isAdmin?: boolean
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  showStatistics?: boolean
}

export function UserInfoCard({
  userId,
  userName,
  userAvatar,
  children,
  isAdmin = false,
  side = "right",
  align = "center",
  showStatistics = true,
}: UserInfoCardProps) {
  const t = useTranslations("UserCard")
  const router = useRouter()
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [isMessageLoading, setIsMessageLoading] = useState(false)

  // 获取当前用户信息
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  // 判断是否是自己的卡片
  const isOwnCard = currentUserId === userId

  // 使用 SWR 获取徽章数据，仅在卡片打开时才请求
  const { data: badgesData, isLoading: badgesLoading } =
    useSWR<BadgeListResponse>(open ? `/api/users/${userId}/badges` : null, {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5分钟缓存
    })

  // 使用 SWR 获取用户资料，仅在卡片打开时才请求
  const { data: profileData } = useSWR<UserProfile>(
    open ? `/api/users/${userId}/profile` : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5分钟缓存
    }
  )

  // 使用 SWR 获取用户统计数据，仅在需要显示统计且卡片打开时才请求
  const { data: statisticsData, isLoading: statisticsLoading } =
    useSWR<UserStatistics>(
      open && showStatistics ? `/api/users/${userId}/statistics` : null,
      {
        revalidateOnFocus: false,
        dedupingInterval: 300000, // 5分钟缓存
      }
    )

  // 获取关注状态
  const { data: followStatusData } = useSWR<{ isFollowing: boolean }>(
    open ? `/api/users/${userId}/follow/status` : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1分钟缓存
    }
  )

  const badges = badgesData?.items || []
  const maxBadgeDisplay = isMobile ? 3 : 6
  const isFollowing = followStatusData?.isFollowing || false

  // 处理关注/取消关注
  const handleFollowClick = async () => {
    if (isFollowLoading) return

    setIsFollowLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to toggle follow")
      }

      const data = await response.json()

      // 更新关注状态缓存
      mutate(`/api/users/${userId}/follow/status`, {
        isFollowing: data.isFollowing,
      })

      // 更新统计数据缓存，粉丝数量立即+1或-1
      if (statisticsData) {
        mutate(
          `/api/users/${userId}/statistics`,
          {
            ...statisticsData,
            followersCount: data.isFollowing
              ? statisticsData.followersCount + 1
              : statisticsData.followersCount - 1,
          },
          false
        )
      }

      toast.success(
        data.isFollowing ? t("followSuccess") : t("unfollowSuccess")
      )
    } catch (error) {
      console.error("Error toggling follow:", error)
      toast.error(t("followError"))
    } finally {
      setIsFollowLoading(false)
    }
  }

  // 处理私信点击
  const handleMessageClick = async (): Promise<void> => {
    if (!currentUserId) {
      toast.error(t("messageLoginRequired"))
      return
    }

    if (isMessageLoading) {
      return
    }

    setIsMessageLoading(true)
    try {
      const payload: CreateConversationPayload = {
        type: "DM",
        targetUserId: userId,
      }

      // 创建或获取会话
      const response: Response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Failed to create conversation")
      }

      const data: CreateConversationResponse = await response.json()
      const conversationId =
        data.conversation?.id ?? data.conversationId ?? data.id

      if (!conversationId) {
        throw new Error("Conversation id is missing")
      }

      // 跳转到私信页面
      router.push(`/conversations/${conversationId}`)
      setOpen(false)
    } catch (error) {
      console.error("Error creating conversation:", error)
      toast.error(t("messageError"))
    } finally {
      setIsMessageLoading(false)
    }
  }

  // 格式化加入时间
  const formatJoinedDate = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const displayName = userName || profileData?.name || ""
  const displayAvatar = userAvatar || profileData?.avatar

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className="w-md max-sm:w-80 p-0 overflow-hidden"
      >
        <div className="flex flex-col gap-4 p-4">
          {/* 头部区域 */}
          <div className="flex flex-row items-start gap-4">
            {/* 头像区域 */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-linear-to-br from-primary to-accent opacity-20 blur-sm" />
              <Avatar className="h-16 w-16 max-sm:h-14 max-sm:w-14 relative border-2 border-primary/30">
                <AvatarImage
                  src={displayAvatar || undefined}
                  alt={displayName}
                />
                <AvatarFallback className="text-xl max-sm:text-lg">
                  {displayName.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex flex-col gap-1 w-full min-w-0">
              {/* 用户信息区域 */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl max-sm:text-lg font-semibold truncate">
                  {displayName}
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
                {profileData?.customStatus && (
                  <Badge variant="secondary" className="text-xs">
                    {profileData.customStatus.emoji && (
                      <span className="text-base">
                        {profileData.customStatus.emoji}
                      </span>
                    )}
                    <span className="truncate max-w-32">
                      {profileData.customStatus.statusText}
                    </span>
                  </Badge>
                )}
              </div>

              {/* 个人简介 */}
              {profileData?.bio && (
                <div className="text-sm text-muted-foreground line-clamp-2 break-all">
                  {profileData.bio}
                </div>
              )}

              {/* 详细信息列表 */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                {profileData?.location && (
                  <div
                    className="flex items-center gap-1"
                    title={t("location")}
                  >
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate max-w-[120px]">
                      {profileData.location}
                    </span>
                  </div>
                )}

                {profileData?.website && (
                  <a
                    href={
                      profileData.website.startsWith("http")
                        ? profileData.website
                        : `https://${profileData.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                    title={t("website")}
                  >
                    <LinkIcon className="h-3 w-3 shrink-0" />
                    <span className="truncate max-w-[120px]">
                      {profileData.website.replace(/^https?:\/\//, "")}
                    </span>
                  </a>
                )}

                {profileData?.birthday && (
                  <div
                    className="flex items-center gap-1"
                    title={t("birthday")}
                  >
                    <Cake className="h-3 w-3 shrink-0" />
                    <span>
                      {new Date(profileData.birthday).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* 加入时间 */}
                {statisticsData?.joinedAt && (
                  <div
                    className="flex items-center gap-1"
                    title={t("joinedAt")}
                  >
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span>{formatJoinedDate(statisticsData.joinedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 统计数据区域 */}
          {showStatistics && (
            <div className="grid grid-cols-5 gap-2 py-2 border-y">
              {statisticsLoading ? (
                <>
                  <div className="text-center">
                    <Skeleton className="h-6 w-8 mx-auto mb-1" />
                    <Skeleton className="h-4 w-12 mx-auto" />
                  </div>
                  <div className="text-center">
                    <Skeleton className="h-6 w-8 mx-auto mb-1" />
                    <Skeleton className="h-4 w-12 mx-auto" />
                  </div>
                  <div className="text-center">
                    <Skeleton className="h-6 w-8 mx-auto mb-1" />
                    <Skeleton className="h-4 w-12 mx-auto" />
                  </div>
                  <div className="text-center">
                    <Skeleton className="h-6 w-8 mx-auto mb-1" />
                    <Skeleton className="h-4 w-12 mx-auto" />
                  </div>
                  <div className="text-center">
                    <Skeleton className="h-6 w-8 mx-auto mb-1" />
                    <Skeleton className="h-4 w-12 mx-auto" />
                  </div>
                </>
              ) : statisticsData ? (
                <>
                  <div className="text-center">
                    <div className="text-base font-semibold">
                      {statisticsData.topicsCount}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("statistics.topics")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-semibold">
                      {statisticsData.postsCount}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("statistics.posts")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-semibold">
                      {statisticsData.likesReceived}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("statistics.likes")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-semibold">
                      {statisticsData.followersCount}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("statistics.followers")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-semibold">
                      {statisticsData.credits}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("statistics.credits")}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* 徽章展示区域 */}
          {badgesLoading ? (
            <div className="flex flex-col justify-center gap-4">
              <div className="flex justify-center gap-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="flex justify-center gap-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          ) : badges.length > 0 ? (
            <UserBadgesDisplay
              badges={badges}
              maxDisplay={maxBadgeDisplay}
              size="sm"
            />
          ) : null}

          {/* 操作按钮区域 */}
          <div className="flex flex-col gap-2 pt-1">
            {/* 关注和私信按钮行 - 只在不是自己的卡片时显示 */}
            {!isOwnCard && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    handleFollowClick()
                  }}
                  disabled={isFollowLoading}
                  className="w-full"
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="h-4 w-4 mr-1" />
                      {t("following")}
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-1" />
                      {t("follow")}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    handleMessageClick()
                  }}
                  className="w-full"
                  disabled={!currentUserId || isMessageLoading}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {t("message")}
                </Button>
              </div>
            )}
            {/* 查看主页按钮 */}
            <Link
              href={`/u/${encodeUsername(displayName)}`}
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
