"use client"

import { useRef, useCallback, useEffect, memo } from "react"
import useSWRInfinite from "swr/infinite"
import { useTranslations } from "next-intl"
import { Heart, Users, DollarSign } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { UserInfoCard } from "@/components/common/user-info-card"
import { MagicCard } from "@/components/ui/magic-card"
import { useTheme } from "next-themes"
import { BorderBeam } from "@/components/ui/border-beam"
import { Skeleton } from "@/components/ui/skeleton"

type DonationType = "month" | "year" | "all"

type DonorInfo = {
  id: string | null
  name: string
  avatar: string
  isAnonymous: boolean
}

type RankingDonor = {
  rank: number
  donor: DonorInfo
  amount: number
  currency: string
  message: string | null
  donatedAt: string
}

type DonationResponse = {
  type: DonationType
  period: {
    year?: number
    month?: number
  }
  rankings: RankingDonor[]
  hasMore: boolean
  total: number
  page: number
  pageSize: number
  totalAmount: number
  totalCount: number
  updatedAt: string
}

const PAGE_SIZE = 20

const fetcher = async (url: string): Promise<DonationResponse> => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error("Failed to fetch donation data")
  }
  return res.json()
}

// 货币符号映射
const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    CNY: "¥",
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
  }
  return symbols[currency.toUpperCase()] || currency
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

type DonationItemProps = {
  ranking: RankingDonor
}

const DonationItem = memo(function DonationItem({
  ranking,
}: DonationItemProps) {
  const { resolvedTheme } = useTheme()
  const t = useTranslations("Donation")

  const currencySymbol = getCurrencySymbol(ranking.currency)

  const content = (
    <MagicCard
      gradientColor={resolvedTheme === "dark" ? "#262626" : "#D9D9D955"}
      className={`p-4 rounded-2xl ${ranking.donor.isAnonymous ? "" : "cursor-pointer"}`}
    >
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex flex-row items-center gap-4 max-sm:gap-2">
          <RankBadge rank={ranking.rank} />
          <Avatar className="size-8 sm:size-10">
            <AvatarImage
              src={ranking.donor.avatar}
              alt={
                ranking.donor.isAnonymous ? t("anonymous") : ranking.donor.name
              }
            />
            <AvatarFallback>
              {ranking.donor.isAnonymous
                ? "🎁"
                : ranking.donor.name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="font-semibold text-lg text-muted-foreground">
            {ranking.donor.isAnonymous ? t("anonymous") : ranking.donor.name}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-lg font-bold text-primary">
            {currencySymbol}
            {ranking.amount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          {ranking.message && (
            <p className="text-xs text-muted-foreground italic max-w-50 truncate">
              {ranking.message}
            </p>
          )}
        </div>
      </div>
    </MagicCard>
  )

  if (ranking.donor.isAnonymous) {
    return <div>{content}</div>
  }

  return (
    <UserInfoCard
      userId={ranking.donor.id || ""}
      userName={ranking.donor.name}
      userAvatar={ranking.donor.avatar}
      side="top"
      align="center"
    >
      <div>{content}</div>
    </UserInfoCard>
  )
})

// 列表项骨架屏
const DonationItemSkeleton = memo(function DonationItemSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex flex-row items-center gap-4 max-sm:gap-2">
          <Skeleton className="size-8 sm:size-10 rounded-full" />
          <Skeleton className="size-8 sm:size-10 rounded-full" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  )
})

// Top3 骨架屏
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
              <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                <Skeleton className="h-3 sm:h-6 w-10 sm:w-16" />
                <Skeleton className="h-2 sm:h-3 w-16 sm:w-24" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
})

// 统计信息骨架屏
const StatsSkeleton = memo(function StatsSkeleton() {
  return (
    <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[0, 1].map((i) => (
        <Card key={i} className="shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Skeleton className="size-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
})

type TopThreeDisplayProps = {
  rankings: RankingDonor[]
}

function TopThreeDisplay({ rankings }: TopThreeDisplayProps) {
  const t = useTranslations("Donation")

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
        const currencySymbol = getCurrencySymbol(ranking.currency)

        const cardContent = (
          <div className="w-full flex flex-col items-center cursor-pointer transition-transform hover:scale-105">
            <div
              className={`mb-1 sm:mb-3 flex items-center justify-center ${
                isFirst ? "size-12 sm:size-24" : "size-10 sm:size-20"
              }`}
            >
              <RankBadge rank={ranking.rank} />
            </div>
            <Card className="w-full relative shadow-none overflow-hidden py-4 sm:py-10">
              <CardContent className="min-w-0 w-full px-2 sm:px-8 text-center">
                <Avatar
                  className={`mx-auto mb-1 sm:mb-3 ${isFirst ? "size-10 sm:size-16" : "size-8 sm:size-14"}`}
                >
                  <AvatarImage
                    src={ranking.donor.avatar}
                    alt={
                      ranking.donor.isAnonymous
                        ? t("anonymous")
                        : ranking.donor.name
                    }
                  />
                  <AvatarFallback className="text-sm sm:text-xl">
                    {ranking.donor.isAnonymous
                      ? "🎁"
                      : ranking.donor.name.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`mb-0.5 sm:mb-2 font-semibold truncate mx-auto ${
                    isFirst
                      ? "text-xs sm:text-lg max-w-16 sm:max-w-36"
                      : "text-xs sm:text-base max-w-14 sm:max-w-32"
                  }`}
                >
                  {ranking.donor.isAnonymous
                    ? t("anonymous")
                    : ranking.donor.name}
                </div>
                <div className="flex flex-col items-center justify-center gap-0 sm:gap-1">
                  <span
                    className={`font-bold text-primary ${
                      isFirst ? "text-sm sm:text-xl" : "text-xs sm:text-lg"
                    }`}
                  >
                    {currencySymbol}
                    {ranking.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {ranking.message && (
                  <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-muted-foreground italic line-clamp-1 sm:line-clamp-2">
                    {ranking.message}
                  </p>
                )}
              </CardContent>
              <BorderBeam
                duration={6}
                size={150}
                className="from-transparent via-amber-500 to-transparent"
              />
              <BorderBeam
                duration={6}
                delay={3}
                size={150}
                borderWidth={2}
                className="from-transparent via-pink-500 to-transparent"
              />
            </Card>
          </div>
        )

        return (
          <div
            key={`${ranking.rank}-${ranking.donor.id || ranking.donatedAt}`}
            className={`flex flex-col items-center ${
              isFirst ? "order-2" : ranking.rank === 2 ? "order-1" : "order-3"
            }`}
          >
            {ranking.donor.isAnonymous ? (
              cardContent
            ) : (
              <UserInfoCard
                userId={ranking.donor.id || ""}
                userName={ranking.donor.name}
                userAvatar={ranking.donor.avatar}
                side="bottom"
                align="center"
              >
                {cardContent}
              </UserInfoCard>
            )}
          </div>
        )
      })}
    </div>
  )
}

type StatsSectionProps = {
  totalAmount: number
  totalCount: number
  currency: string
}

function StatsSection({
  totalAmount,
  totalCount,
  currency,
}: StatsSectionProps) {
  const t = useTranslations("Donation")
  const currencySymbol = getCurrencySymbol(currency)

  return (
    <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card className="shadow-none">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <DollarSign className="size-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("totalAmount")}
              </p>
              <p className="text-2xl font-bold text-primary">
                {currencySymbol}
                {totalAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Users className="size-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("totalCount")}</p>
              <p className="text-2xl font-bold">
                {totalCount} {t("people")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

type DonationListProps = {
  type: DonationType
}

export function DonationList({ type }: DonationListProps) {
  const t = useTranslations("Donation")
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // SWR Infinite 配置
  const getKey = useCallback(
    (pageIndex: number, previousPageData: DonationResponse | null) => {
      if (previousPageData && !previousPageData.hasMore) return null
      return `/api/donation?type=${type}&page=${pageIndex + 1}&pageSize=${PAGE_SIZE}`
    },
    [type]
  )

  const { data, error, isLoading, isValidating, size, setSize } =
    useSWRInfinite<DonationResponse>(getKey, fetcher, {
      revalidateOnFocus: false,
      revalidateFirstPage: false,
    })

  // 合并所有页的数据
  const allRankings = data ? data.flatMap((page) => page.rankings) : []
  const hasMore = data ? (data[data.length - 1]?.hasMore ?? false) : false
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined")
  const total = data?.[0]?.total ?? 0
  const totalAmount = data?.[0]?.totalAmount ?? 0
  const totalCount = data?.[0]?.totalCount ?? 0
  const updatedAt = data?.[0]?.updatedAt

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
        <StatsSkeleton />
        <TopThreeSkeleton />
        <div>
          <Skeleton className="h-5 w-24 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <DonationItemSkeleton key={i} />
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
          <Heart className="mx-auto mb-4 size-16 text-muted-foreground/50" />
          <div className="mb-2 text-lg">{t("noData")}</div>
          <div className="text-sm text-muted-foreground">{t("noDataDesc")}</div>
        </div>
      </div>
    )
  }

  // 区分前三名和其他排名
  const topThree = allRankings.slice(0, 3)
  const restRankings = allRankings.slice(3)

  // 使用第一个捐赠记录的货币作为统计货币（简化处理）
  const currency = allRankings[0]?.currency || "CNY"

  return (
    <div className="space-y-6">
      {/* 统计信息 */}
      <StatsSection
        totalAmount={totalAmount}
        totalCount={totalCount}
        currency={currency}
      />

      {/* 前三名特殊展示 */}
      <TopThreeDisplay rankings={topThree} />

      {/* 其他排名列表 */}
      {restRankings.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
            {t("fullLeaderboard")} ({total > 3 ? total - 3 : 0})
          </h3>
          <div className="space-y-4">
            {restRankings.map((ranking) => (
              <DonationItem
                key={`${ranking.rank}-${ranking.donor.id || ranking.donatedAt}`}
                ranking={ranking}
              />
            ))}
          </div>

          {/* 加载更多触发器 */}
          <div ref={loadMoreRef} className="py-2" />

          {/* 骨架屏：加载更多时显示 */}
          {isLoadingMore && hasMore && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <DonationItemSkeleton key={`skeleton-${i}`} />
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
