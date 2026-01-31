"use client"

import { useState, useRef, useCallback, useEffect, memo } from "react"
import useSWRInfinite from "swr/infinite"
import { useTranslations } from "next-intl"
import { Trophy, Medal, Award, TrendingUp, ChartColumn } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { UserInfoCard } from "@/components/common/user-info-card"
import { MagicCard } from "@/components/ui/magic-card"
import { useTheme } from "next-themes"
import { BorderBeam } from "@/components/ui/border-beam"
import { useCurrentUser } from "@/hooks/use-current-user"

type LeaderboardType = "wealth" | "pioneer" | "expert" | "reputation"

type RankingUser = {
  rank: number
  user: {
    id: string
    name: string
    avatar: string
  }
  value: number
}

type LeaderboardResponse = {
  type: LeaderboardType
  rankings: RankingUser[]
  hasMore: boolean
  total: number
  page: number
  pageSize: number
  currentUserRanking?: RankingUser | null
  updatedAt: string
}

const PAGE_SIZE = 20

const fetcher = async (url: string): Promise<LeaderboardResponse> => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error("Failed to fetch leaderboard")
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

function LeaderboardItem({
  ranking,
  valueLabel,
}: {
  ranking: RankingUser
  valueLabel: string
  highlight?: boolean
}) {
  const { resolvedTheme } = useTheme()
  return (
    <UserInfoCard
      userId={ranking.user.id}
      userName={ranking.user.name}
      userAvatar={ranking.user.avatar}
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
              <RankBadge rank={ranking.rank} />
              <Avatar className="size-8 sm:size-10">
                <AvatarImage
                  src={ranking.user.avatar}
                  alt={ranking.user.name}
                />
                <AvatarFallback>
                  {ranking.user.name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={`font-semibold text-lg text-muted-foreground`}>
                {ranking.user.name}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {valueLabel}:
              </span>
              <span className="text-lg font-bold sm:text-xl">
                {ranking.value.toLocaleString()}
              </span>
            </div>
          </div>
        </MagicCard>
      </div>
    </UserInfoCard>
  )
}

// 骨架屏组件
const LeaderboardItemSkeleton = memo(function LeaderboardItemSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex flex-row items-center gap-4 max-sm:gap-2">
          <Skeleton className="size-8 sm:size-10 rounded-full" />
          <Skeleton className="size-8 sm:size-10 rounded-full" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-6 w-16" />
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
              <div className="flex flex-col sm:flex-row items-center gap-0 sm:gap-1">
                <Skeleton className="h-2 sm:h-3 w-6 sm:w-8" />
                <Skeleton className="h-3 sm:h-6 w-8 sm:w-14" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
})

function TopThreeDisplay({
  rankings,
  valueLabel,
}: {
  rankings: RankingUser[]
  valueLabel: string
}) {
  const topThree = rankings.slice(0, 3)
  if (topThree.length === 0) return null

  // 按照 2-1-3 的顺序排列（中间是第一名）
  const orderedRankings = [
    topThree[1], // 第二名
    topThree[0], // 第一名
    topThree[2], // 第三名
  ].filter(Boolean)

  return (
    <div className="mb-8 grid grid-cols-3 gap-2 sm:gap-6">
      {orderedRankings.map((ranking) => {
        const isFirst = ranking.rank === 1
        return (
          <div
            key={ranking.user.id}
            className={`flex flex-col items-center ${
              isFirst
                ? "order-2 sm:order-2"
                : ranking.rank === 2
                  ? "order-1 sm:order-1"
                  : "order-3 sm:order-3"
            }`}
          >
            <UserInfoCard
              userId={ranking.user.id}
              userName={ranking.user.name}
              userAvatar={ranking.user.avatar}
              side="bottom"
              align="center"
            >
              <div className="flex flex-col items-center cursor-pointer transition-transform hover:scale-105">
                <div
                  className={`mb-1 sm:mb-3 flex items-center justify-center ${
                    isFirst ? "size-12 sm:size-24" : "size-10 sm:size-20"
                  }`}
                >
                  <RankBadge rank={ranking.rank} />
                </div>
                <Card className="relative shadow-none overflow-hidden py-4 sm:py-10">
                  <CardContent className="min-w-0 w-full px-2 sm:px-8 text-center">
                    <Avatar
                      className={`mx-auto mb-1 sm:mb-3 ${isFirst ? "size-10 sm:size-16" : "size-8 sm:size-14"}`}
                    >
                      <AvatarImage
                        src={ranking.user.avatar}
                        alt={ranking.user.name}
                      />
                      <AvatarFallback className="text-sm sm:text-xl">
                        {ranking.user.name.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`mb-0.5 sm:mb-2 font-semibold truncate mx-auto ${
                        isFirst
                          ? "text-xs sm:text-lg max-w-16 sm:max-w-36"
                          : "text-xs sm:text-base max-w-14 sm:max-w-32"
                      }`}
                    >
                      {ranking.user.name}
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-0 sm:gap-1">
                      <span className="text-[10px] sm:text-sm text-muted-foreground">
                        {valueLabel}
                      </span>
                      <span
                        className={`font-bold ${
                          isFirst ? "text-sm sm:text-xl" : "text-xs sm:text-lg"
                        }`}
                      >
                        {ranking.value.toLocaleString()}
                      </span>
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

function LeaderboardList({
  type,
  valueLabel,
}: {
  type: LeaderboardType
  valueLabel: string
}) {
  const t = useTranslations("Leaderboard")
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // SWR Infinite 配置
  const getKey = useCallback(
    (pageIndex: number, previousPageData: LeaderboardResponse | null) => {
      if (previousPageData && !previousPageData.hasMore) return null
      return `/api/leaderboard?type=${type}&page=${pageIndex + 1}&pageSize=${PAGE_SIZE}`
    },
    [type]
  )

  const { data, error, isLoading, isValidating, size, setSize } =
    useSWRInfinite<LeaderboardResponse>(getKey, fetcher, {
      revalidateOnFocus: false,
      revalidateFirstPage: false,
    })

  // 合并所有页的数据
  const allRankings = data ? data.flatMap((page) => page.rankings) : []
  const hasMore = data ? (data[data.length - 1]?.hasMore ?? false) : false
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined")
  const total = data?.[0]?.total ?? 0
  const updatedAt = data?.[0]?.updatedAt

  // 获取当前用户信息
  const { user: currentUser } = useCurrentUser()

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

  // 初始加载骨架屏
  if (isLoading) {
    return (
      <div className="space-y-6">
        <TopThreeSkeleton />
        <div>
          <Skeleton className="h-5 w-24 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <LeaderboardItemSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-2 text-lg text-destructive">{t("loadFailed")}</div>
          <div className="text-sm text-muted-foreground">{t("retryLater")}</div>
        </div>
      </div>
    )
  }

  if (allRankings.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-2 text-lg">{t("noRankingData")}</div>
          <div className="text-sm text-muted-foreground">
            {t("joinCommunity")}
          </div>
        </div>
      </div>
    )
  }

  // 区分前三名和其他排名
  const topThree = allRankings.slice(0, 3)
  const restRankings = allRankings.slice(3)

  // 查找当前用户的排名（如果不在前三名中）
  const currentUserRanking = currentUser?.id
    ? allRankings.find((r) => r.user.id === currentUser.id)
    : null

  const showCurrentUserRanking =
    currentUserRanking && currentUserRanking.rank > 3

  return (
    <div className="space-y-6">
      {/* 前三名特殊展示 */}
      <TopThreeDisplay rankings={topThree} valueLabel={valueLabel} />

      {/* 当前用户排名（如果不在前三名） */}
      {showCurrentUserRanking && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
            {t("yourRanking")}
          </h3>
          <LeaderboardItem
            ranking={currentUserRanking}
            valueLabel={valueLabel}
            highlight={true}
          />
        </div>
      )}

      {/* 其他排名列表 */}
      {restRankings.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
            {t("fullLeaderboard")} ({total > 3 ? total - 3 : 0})
          </h3>
          <div className="space-y-4">
            {restRankings.map((ranking) => (
              <LeaderboardItem
                key={ranking.user.id}
                ranking={ranking}
                valueLabel={valueLabel}
                highlight={currentUser?.id === ranking.user.id}
              />
            ))}
          </div>

          {/* 加载更多触发器 */}
          <div ref={loadMoreRef} className="py-2" />

          {/* 骨架屏：加载更多时显示 */}
          {isLoadingMore && hasMore && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <LeaderboardItemSkeleton key={`skeleton-${i}`} />
              ))}
            </div>
          )}

          {/* 没有更多数据 */}
          {!hasMore && allRankings.length > 3 && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              {t("noMoreData")}
            </div>
          )}
        </div>
      )}

      {updatedAt && (
        <div className="pt-4 text-center text-xs text-muted-foreground">
          {t("lastUpdated")}：{new Date(updatedAt).toLocaleString("zh-CN")}
        </div>
      )}
    </div>
  )
}

export default function LeaderboardPage() {
  const t = useTranslations("Leaderboard")
  const [activeTab, setActiveTab] = useState<LeaderboardType>("wealth")

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <ChartColumn className="size-8" />
          <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
        </div>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as LeaderboardType)}
      >
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 h-auto">
          <TabsTrigger value="wealth" className="flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">{t("wealth")}</span>
            <span className="sm:hidden">{t("wealthShort")}</span>
          </TabsTrigger>
          <TabsTrigger value="pioneer" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">{t("pioneer")}</span>
            <span className="sm:hidden">{t("pioneerShort")}</span>
          </TabsTrigger>
          <TabsTrigger value="expert" className="flex items-center gap-1">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">{t("expert")}</span>
            <span className="sm:hidden">{t("expertShort")}</span>
          </TabsTrigger>
          <TabsTrigger value="reputation" className="flex items-center gap-1">
            <Medal className="h-4 w-4" />
            <span className="hidden sm:inline">{t("reputation")}</span>
            <span className="sm:hidden">{t("reputationShort")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wealth" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{t("wealth")}</h2>
            <p className="text-sm text-muted-foreground">{t("wealthDesc")}</p>
          </div>
          <LeaderboardList type="wealth" valueLabel={t("credits")} />
        </TabsContent>

        <TabsContent value="pioneer" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{t("pioneer")}</h2>
            <p className="text-sm text-muted-foreground">{t("pioneerDesc")}</p>
          </div>
          <LeaderboardList type="pioneer" valueLabel={t("activities")} />
        </TabsContent>

        <TabsContent value="expert" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{t("expert")}</h2>
            <p className="text-sm text-muted-foreground">{t("expertDesc")}</p>
          </div>
          <LeaderboardList type="expert" valueLabel={t("acceptances")} />
        </TabsContent>

        <TabsContent value="reputation" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{t("reputation")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("reputationDesc")}
            </p>
          </div>
          <LeaderboardList
            type="reputation"
            valueLabel={t("likesAndBookmarks")}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
