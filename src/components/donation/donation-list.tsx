"use client"

import useSWR from "swr"
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
  totalAmount: number
  totalCount: number
  updatedAt: string
}

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
    return <span className="text-7xl">🥇</span>
  }
  if (rank === 2) {
    return <span className="text-5xl">🥈</span>
  }
  if (rank === 3) {
    return <span className="text-5xl">🥉</span>
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

function DonationItem({ ranking }: DonationItemProps) {
  const { resolvedTheme } = useTheme()
  const t = useTranslations("Donation")

  const currencySymbol = getCurrencySymbol(ranking.currency)

  const DonorDisplay = ranking.donor.isAnonymous ? (
    <div>
      <MagicCard
        gradientColor={resolvedTheme === "dark" ? "#262626" : "#D9D9D955"}
        className="p-4 rounded-2xl"
      >
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="flex flex-row items-center gap-4 max-sm:gap-2">
            <RankBadge rank={ranking.rank} />
            <Avatar className="size-8 sm:size-10">
              <AvatarImage src={ranking.donor.avatar} alt={t("anonymous")} />
              <AvatarFallback>🎁</AvatarFallback>
            </Avatar>
            <div className="font-semibold text-lg text-muted-foreground">
              {t("anonymous")}
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
    </div>
  ) : (
    <UserInfoCard
      userId={ranking.donor.id || ""}
      userName={ranking.donor.name}
      userAvatar={ranking.donor.avatar}
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
                  src={ranking.donor.avatar}
                  alt={ranking.donor.name}
                />
                <AvatarFallback>
                  {ranking.donor.name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="font-semibold text-lg text-muted-foreground">
                {ranking.donor.name}
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
      </div>
    </UserInfoCard>
  )

  return DonorDisplay
}

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
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {orderedRankings.map((ranking) => {
        const isFirst = ranking.rank === 1
        const currencySymbol = getCurrencySymbol(ranking.currency)

        const DonorCard = ranking.donor.isAnonymous ? (
          <div className="flex flex-col items-center transition-transform hover:scale-105">
            <div
              className={`mb-3 flex items-center justify-center ${
                isFirst ? "size-24" : "size-20"
              }`}
            >
              <RankBadge rank={ranking.rank} />
            </div>
            <Card className="relative shadow-none overflow-hidden py-12 w-full">
              <CardContent className="min-w-44 px-8 text-center">
                <Avatar className="mx-auto mb-3 size-16">
                  <AvatarImage
                    src={ranking.donor.avatar}
                    alt={t("anonymous")}
                  />
                  <AvatarFallback className="text-xl">🎁</AvatarFallback>
                </Avatar>
                <div
                  className={`mb-2 font-semibold ${
                    isFirst ? "text-lg" : "text-base"
                  }`}
                >
                  {t("anonymous")}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span
                    className={`font-bold text-primary ${
                      isFirst ? "text-xl" : "text-lg"
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
                  <p className="mt-2 text-xs text-muted-foreground italic line-clamp-2">
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
        ) : (
          <UserInfoCard
            userId={ranking.donor.id || ""}
            userName={ranking.donor.name}
            userAvatar={ranking.donor.avatar}
            side="bottom"
            align="center"
          >
            <div className="flex flex-col items-center cursor-pointer transition-transform hover:scale-105">
              <div
                className={`mb-3 flex items-center justify-center ${
                  isFirst ? "size-24" : "size-20"
                }`}
              >
                <RankBadge rank={ranking.rank} />
              </div>
              <Card className="relative shadow-none overflow-hidden py-12 w-full">
                <CardContent className="min-w-44 px-8 text-center">
                  <Avatar className="mx-auto mb-3 size-16">
                    <AvatarImage
                      src={ranking.donor.avatar}
                      alt={ranking.donor.name}
                    />
                    <AvatarFallback className="text-xl">
                      {ranking.donor.name.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`mb-2 font-semibold ${
                      isFirst ? "text-lg" : "text-base"
                    }`}
                  >
                    {ranking.donor.name}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className={`font-bold text-primary ${
                        isFirst ? "text-xl" : "text-lg"
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
                    <p className="mt-2 text-xs text-muted-foreground italic line-clamp-2">
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
          </UserInfoCard>
        )

        return (
          <div
            key={`${ranking.rank}-${ranking.donor.id || ranking.donatedAt}`}
            className={`flex flex-col items-center ${
              isFirst
                ? "sm:order-2"
                : ranking.rank === 2
                  ? "sm:order-1"
                  : "sm:order-3"
            }`}
          >
            {DonorCard}
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

function DonationListSkeleton() {
  return (
    <div className="space-y-6">
      {/* 统计信息骨架 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* 前三名骨架 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center">
            <Skeleton
              className={`mb-3 rounded-full ${i === 1 ? "size-24" : "size-20"}`}
            />
            <Card className="shadow-none py-12 w-full">
              <CardContent className="min-w-44 px-8 text-center space-y-3">
                <Skeleton className="mx-auto size-16 rounded-full" />
                <Skeleton
                  className={`mx-auto ${i === 1 ? "h-6 w-24" : "h-5 w-20"}`}
                />
                <Skeleton className="mx-auto h-8 w-28" />
                <Skeleton className="mx-auto h-4 w-32" />
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* 列表项骨架 */}
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <MagicCard
            key={i}
            gradientColor="#26262600"
            className="p-4 rounded-2xl"
          >
            <div className="flex flex-row items-center justify-between gap-4">
              <div className="flex flex-row items-center gap-4 max-sm:gap-2">
                <Skeleton className="size-8 sm:size-10 rounded-md" />
                <Skeleton className="size-8 sm:size-10 rounded-full" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="flex flex-col items-end gap-1">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </MagicCard>
        ))}
      </div>
    </div>
  )
}

type DonationListProps = {
  type: DonationType
}

export function DonationList({ type }: DonationListProps) {
  const t = useTranslations("Donation")
  const { data, error, isLoading } = useSWR<DonationResponse>(
    `/api/donation?type=${type}`,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 30000,
      dedupingInterval: 5000,
    }
  )

  if (isLoading) {
    return <DonationListSkeleton />
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

  if (!data || data.rankings.length === 0) {
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
  const topThree = data.rankings.slice(0, 3)
  const restRankings = data.rankings.slice(3)

  // 使用第一个捐赠记录的货币作为统计货币（简化处理）
  const currency = data.rankings[0]?.currency || "CNY"

  return (
    <div className="space-y-6">
      {/* 统计信息 */}
      <StatsSection
        totalAmount={data.totalAmount}
        totalCount={data.totalCount}
        currency={currency}
      />

      {/* 前三名特殊展示 */}
      <TopThreeDisplay rankings={topThree} />

      {/* 其他排名列表 */}
      {restRankings.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
            {t("fullLeaderboard")}
          </h3>
          <div className="space-y-4">
            {restRankings.map((ranking) => (
              <DonationItem
                key={`${ranking.rank}-${ranking.donor.id || ranking.donatedAt}`}
                ranking={ranking}
              />
            ))}
          </div>
        </div>
      )}

      {data.updatedAt && (
        <div className="pt-4 text-center text-xs text-muted-foreground">
          {t("lastUpdated")}：{new Date(data.updatedAt).toLocaleString()}
        </div>
      )}
    </div>
  )
}
