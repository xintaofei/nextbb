"use client"

import { useState, useRef, useCallback, useEffect, memo } from "react"
import { useTranslations } from "next-intl"
import { CalendarCheck, ChevronRight, Loader2, Trophy } from "lucide-react"
import useSWR, { mutate } from "swr"
import useSWRInfinite from "swr/infinite"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { format } from "date-fns"
import { zhCN, enUS } from "date-fns/locale"
import { useLocale } from "next-intl"
import { UserInfoCard } from "@/components/common/user-info-card"
import { MagicCard } from "@/components/ui/magic-card"
import { useTheme } from "next-themes"
import { BorderBeam } from "@/components/ui/border-beam"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"
import { Button } from "@/components/ui/button"

type CheckinStatus = {
  hasCheckedInToday: boolean
  consecutiveDays: number
  monthlyCheckins: number
  todayCheckin: {
    date: string
    creditsEarned: number
  } | null
}

type CheckinRecord = {
  id: string
  user: {
    id: string
    name: string
    avatar: string
  }
  creditsEarned: number
  checkinTime: string
  rank: number
}

type CheckinListResponse = {
  success: boolean
  checkins: CheckinRecord[]
  hasMore: boolean
  total: number
  page: number
  pageSize: number
  updatedAt: string
}

const PAGE_SIZE = 20

const statusFetcher = async (url: string): Promise<CheckinStatus | null> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return null
  return res.json()
}

const listFetcher = async (url: string): Promise<CheckinListResponse> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    throw new Error("Failed to fetch checkin list")
  }
  return res.json()
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return <span className="text-4xl sm:text-8xl">🥇</span>
  }
  if (rank === 2) {
    return <span className="text-3xl sm:text-6xl">🥈</span>
  }
  if (rank === 3) {
    return <span className="text-3xl sm:text-6xl">🥉</span>
  }
  return (
    <div className="flex size-8 sm:size-10 items-center justify-center text-sm font-semibold text-muted-foreground">
      #{rank}
    </div>
  )
}

function CheckinItem({ checkin }: { checkin: CheckinRecord }) {
  const { resolvedTheme } = useTheme()
  const locale = useLocale()
  const dateLocale = locale === "zh" ? zhCN : enUS
  const t = useTranslations("Checkin")

  return (
    <UserInfoCard
      userId={checkin.user.id}
      userName={checkin.user.name}
      userAvatar={checkin.user.avatar}
      side="top"
      align="center"
    >
      <div>
        <MagicCard
          gradientColor={resolvedTheme === "dark" ? "#262626" : "#D9D9D955"}
          className="p-4 cursor-pointer rounded-2xl"
        >
          <div className="flex flex-row items-center justify-between gap-4">
            <div className="flex flex-row items-center gap-4 max-sm:gap-2">
              <RankBadge rank={checkin.rank} />
              <Avatar className="size-8 sm:size-10">
                <AvatarImage
                  src={checkin.user.avatar}
                  alt={checkin.user.name}
                />
                <AvatarFallback>
                  {checkin.user.name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="font-semibold text-lg text-muted-foreground">
                {checkin.user.name}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="secondary">
                +{checkin.creditsEarned} {t("credits")}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(checkin.checkinTime), "HH:mm:ss", {
                  locale: dateLocale,
                })}
              </span>
            </div>
          </div>
        </MagicCard>
      </div>
    </UserInfoCard>
  )
}

// 骨架屏组件
const CheckinItemSkeleton = memo(function CheckinItemSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex flex-row items-center gap-4 max-sm:gap-2">
          <Skeleton className="size-8 sm:size-10 rounded-full" />
          <Skeleton className="size-8 sm:size-10 rounded-full" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>
    </div>
  )
})

const TopThreeSkeleton = memo(function TopThreeSkeleton() {
  return (
    <div className="mb-8 grid grid-cols-3 gap-2 sm:gap-6">
      {[2, 1, 3].map((i) => (
        <div
          key={i}
          className={`flex flex-col items-center ${
            i === 1 ? "order-2" : i === 2 ? "order-1" : "order-3"
          }`}
        >
          <Skeleton
            className={`mb-1 sm:mb-3 rounded-full ${i === 1 ? "size-12 sm:size-24" : "size-10 sm:size-20"}`}
          />
          <div className="rounded-xl border bg-card py-4 sm:py-10 px-2 sm:px-8 w-full">
            <div className="flex flex-col items-center">
              <Skeleton
                className={`rounded-full mb-1 sm:mb-3 ${i === 1 ? "size-10 sm:size-16" : "size-8 sm:size-14"}`}
              />
              <Skeleton className="h-3 sm:h-5 w-12 sm:w-20 mb-0.5 sm:mb-2" />
              <Skeleton className="h-6 w-14 sm:w-20 mb-1 sm:mb-2" />
              <Skeleton className="h-2 sm:h-4 w-10 sm:w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
})

function TopThreeDisplay({ checkins }: { checkins: CheckinRecord[] }) {
  const t = useTranslations("Checkin")
  const locale = useLocale()
  const dateLocale = locale === "zh" ? zhCN : enUS
  const topThree = checkins.slice(0, 3)
  if (topThree.length === 0) return null

  // 按照 2-1-3 的顺序排列（中间是第一名）
  const orderedCheckins = [
    topThree[1], // 第二名
    topThree[0], // 第一名
    topThree[2], // 第三名
  ].filter(Boolean)

  return (
    <div className="mb-8 grid grid-cols-3 gap-2 sm:gap-6">
      {orderedCheckins.map((checkin) => {
        const isFirst = checkin.rank === 1
        return (
          <div
            key={checkin.id}
            className={`flex flex-col items-center ${
              isFirst
                ? "order-2 sm:order-2"
                : checkin.rank === 2
                  ? "order-1 sm:order-1"
                  : "order-3 sm:order-3"
            }`}
          >
            <UserInfoCard
              userId={checkin.user.id}
              userName={checkin.user.name}
              userAvatar={checkin.user.avatar}
              side="bottom"
              align="center"
            >
              <div className="flex flex-col items-center cursor-pointer transition-transform hover:scale-105">
                <div
                  className={`mb-1 sm:mb-3 flex items-center justify-center ${
                    isFirst ? "size-12 sm:size-24" : "size-10 sm:size-20"
                  }`}
                >
                  <RankBadge rank={checkin.rank} />
                </div>
                <Card className="relative shadow-none overflow-hidden py-4 sm:py-10">
                  <CardContent className="min-w-0 w-full px-2 sm:px-8 text-center">
                    <Avatar
                      className={`mx-auto mb-1 sm:mb-3 ${isFirst ? "size-10 sm:size-16" : "size-8 sm:size-14"}`}
                    >
                      <AvatarImage
                        src={checkin.user.avatar}
                        alt={checkin.user.name}
                      />
                      <AvatarFallback className="text-sm sm:text-xl">
                        {checkin.user.name.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`mb-0.5 sm:mb-2 font-semibold truncate mx-auto ${
                        isFirst
                          ? "text-xs sm:text-lg max-w-16 sm:max-w-36"
                          : "text-xs sm:text-base max-w-14 sm:max-w-32"
                      }`}
                    >
                      {checkin.user.name}
                    </div>
                    <div className="flex flex-col items-center justify-center gap-0 sm:gap-1">
                      <Badge
                        variant="secondary"
                        className="text-[10px] sm:text-sm"
                      >
                        +{checkin.creditsEarned} {t("credits")}
                      </Badge>
                    </div>
                    <div className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-muted-foreground">
                      {format(new Date(checkin.checkinTime), "HH:mm:ss", {
                        locale: dateLocale,
                      })}
                    </div>
                  </CardContent>
                  <BorderBeam
                    duration={6}
                    size={150}
                    className="from-transparent via-red-500 to-transparent"
                  />
                  <BorderBeam
                    duration={6}
                    delay={3}
                    size={150}
                    borderWidth={2}
                    className="from-transparent via-blue-500 to-transparent"
                  />
                </Card>
              </div>
            </UserInfoCard>
          </div>
        )
      })}
    </div>
  )
}

function CheckinStatusSkeleton() {
  return (
    <div className="flex flex-col justify-center items-center gap-4 max-sm:gap-2">
      <div className="flex flex-col gap-4 items-center mt-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-80" />
      </div>

      <div className="flex flex-col mt-8 items-center gap-4">
        <Skeleton className="h-10 w-full sm:w-64" />
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    </div>
  )
}

function CheckinListSkeleton() {
  return (
    <div className="mt-16 max-sm:mt-8">
      <div className="flex flex-col gap-2 items-center">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-48" />
      </div>

      <div className="mt-8 max-sm:mt-4">
        <TopThreeSkeleton />
        <Skeleton className="h-5 w-24 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <CheckinItemSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function CheckinSection() {
  const t = useTranslations("Checkin")
  const [isChecking, setIsChecking] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // 获取用户时区偏移量（分钟）
  const timezoneOffset = new Date().getTimezoneOffset()

  const { data: checkinStatus, isLoading: isStatusLoading } =
    useSWR<CheckinStatus | null>(
      `/api/checkin?timezoneOffset=${timezoneOffset}`,
      statusFetcher,
      {
        refreshInterval: 60000,
      }
    )

  // SWR Infinite 配置
  const getKey = useCallback(
    (pageIndex: number, previousPageData: CheckinListResponse | null) => {
      if (previousPageData && !previousPageData.hasMore) return null
      return `/api/checkin?list=today&timezoneOffset=${timezoneOffset}&page=${pageIndex + 1}&pageSize=${PAGE_SIZE}`
    },
    [timezoneOffset]
  )

  const {
    data,
    error,
    isLoading: isListLoading,
    isValidating,
    size,
    setSize,
    mutate: mutateList,
  } = useSWRInfinite<CheckinListResponse>(getKey, listFetcher, {
    revalidateOnFocus: false,
    revalidateFirstPage: false,
    refreshInterval: 30000,
  })

  // 合并所有页的数据
  const allCheckins = data ? data.flatMap((page) => page.checkins) : []
  const hasMore = data ? (data[data.length - 1]?.hasMore ?? false) : false
  const isLoadingMore =
    isListLoading || (size > 0 && data && typeof data[size - 1] === "undefined")
  const total = data?.[0]?.total ?? 0

  // IntersectionObserver 触发加载更多
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isValidating) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isValidating) {
          setSize(size + 1)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasMore, isValidating, size, setSize])

  const handleCheckin = async (event: React.MouseEvent<HTMLButtonElement>) => {
    try {
      const rect = event.currentTarget.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2

      setIsChecking(true)

      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timezoneOffset }),
      })

      const result = await res.json()

      if (res.ok) {
        toast.success(t("success", { credits: result.creditsEarned }))
        // 刷新签到状态和签到列表
        mutate(`/api/checkin?timezoneOffset=${timezoneOffset}`)
        mutateList()

        confetti({
          origin: {
            x: x / window.innerWidth,
            y: y / window.innerHeight,
          },
        })
      } else {
        if (result.alreadyCheckedIn) {
          toast.info(t("alreadyCheckedIn"))
        } else {
          toast.error(result.error || t("error"))
        }
      }
    } catch (error) {
      console.error("Checkin error:", error)
      toast.error(t("error"))
    } finally {
      setIsChecking(false)
    }
  }

  const hasCheckedIn = checkinStatus?.hasCheckedInToday || false
  const consecutiveDays = checkinStatus?.consecutiveDays || 0
  const monthlyCheckins = checkinStatus?.monthlyCheckins || 0

  const topThree = allCheckins.slice(0, 3)
  const restCheckins = allCheckins.slice(3)

  return (
    <div className="space-y-8">
      {/* 签到卡片 */}
      {isStatusLoading ? (
        <CheckinStatusSkeleton />
      ) : (
        <div className="flex flex-col justify-center items-center gap-4 max-sm:gap-2">
          <div className="flex flex-col gap-4 items-center mt-4">
            <span className="flex items-center gap-2 text-4xl font-medium">
              <CalendarCheck className="size-10" />
              {t("title")}
            </span>
            <span className="text-muted-foreground">{t("description")}</span>
          </div>

          <div className="relative flex flex-col mt-8 items-center gap-4">
            <Button
              className="group relative mx-auto flex items-center justify-center rounded-full px-4 py-1.5 bg-primary-foreground hover:bg-muted shadow-[inset_0_-8px_10px_#8fdfff1f] transition-shadow duration-500 ease-out hover:shadow-[inset_0_-5px_10px_#8fdfff3f]"
              onClick={handleCheckin}
              disabled={isChecking || hasCheckedIn}
            >
              <span
                className={cn(
                  "animate-gradient absolute inset-0 block h-full w-full rounded-[inherit] bg-linear-to-r from-[#ffaa40]/50 via-[#9c40ff]/50 to-[#ffaa40]/50 bg-size-[300%_100%] p-px"
                )}
                style={{
                  WebkitMask:
                    "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "destination-out",
                  mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  maskComposite: "subtract",
                  WebkitClipPath: "padding-box",
                }}
              />
              🎉 <hr className="mx-2 h-4 w-px shrink-0 bg-border" />
              <AnimatedGradientText className="text-sm font-medium">
                {isChecking
                  ? t("checking")
                  : hasCheckedIn
                    ? t("todayEarned", {
                        credits:
                          checkinStatus?.todayCheckin?.creditsEarned || 10,
                      })
                    : t("earnCredits", { credits: 10 })}
              </AnimatedGradientText>
              {isChecking ? (
                <Loader2 className="ml-1 size-4 stroke-neutral-500 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
              ) : (
                <ChevronRight className="ml-1 size-4 stroke-neutral-500 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
              )}
            </Button>

            <div className="flex flex-wrap gap-4 text-sm">
              {consecutiveDays > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    <Trophy className="mr-1 h-3 w-3" />
                    {t("consecutiveDays", { days: consecutiveDays })}
                  </Badge>
                </div>
              )}
              {monthlyCheckins > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {t("monthlyCheckins", { days: monthlyCheckins })}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 今日签到列表 */}
      {isListLoading ? (
        <CheckinListSkeleton />
      ) : error ? (
        <div className="mt-16 max-sm:mt-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-2 text-lg text-destructive">
                {t("loadFailed")}
              </div>
              <div className="text-sm text-muted-foreground">
                {t("retryLater")}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-16 max-sm:mt-8">
          <div className="flex flex-col gap-2 items-center">
            <span className="flex items-center gap-1 text-2xl font-medium">
              <Trophy className="size-5" />
              {t("todayList")}
            </span>
            <span className="text-muted-foreground">
              {t("todayListDescription", { count: total })}
            </span>
          </div>
          <div className="mt-8 max-sm:mt-4">
            {allCheckins.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CalendarCheck className="mb-4 h-12 w-12 opacity-20" />
                <p>{t("noCheckinToday")}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 前三名特殊展示 */}
                {topThree.length > 0 && <TopThreeDisplay checkins={topThree} />}

                {/* 其余用户列表 */}
                {restCheckins.length > 0 && (
                  <div>
                    <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
                      {t("fullList")} ({total > 3 ? total - 3 : 0})
                    </h3>
                    <div className="space-y-4">
                      {restCheckins.map((checkin) => (
                        <CheckinItem key={checkin.id} checkin={checkin} />
                      ))}
                    </div>

                    {/* 加载更多触发器 */}
                    <div ref={loadMoreRef} className="py-2" />

                    {/* 骨架屏：加载更多时显示 */}
                    {isLoadingMore && hasMore && (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <CheckinItemSkeleton key={`skeleton-${i}`} />
                        ))}
                      </div>
                    )}

                    {/* 没有更多数据 */}
                    {!hasMore && allCheckins.length > 3 && (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        {t("noMoreData")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
