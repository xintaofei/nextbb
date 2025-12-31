"use client"

import { useState } from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import { Trophy, Medal, Award, TrendingUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserInfoCard } from "@/components/common/user-info-card"

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
  currentUserRanking?: RankingUser | null
  updatedAt: string
}

const fetcher = async (url: string): Promise<LeaderboardResponse> => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error("Failed to fetch leaderboard")
  }
  return res.json()
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return <span className="text-2xl">🥇</span>
  }
  if (rank === 2) {
    return <span className="text-2xl">🥈</span>
  }
  if (rank === 3) {
    return <span className="text-2xl">🥉</span>
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
      {rank}
    </div>
  )
}

function LeaderboardItem({
  ranking,
  valueLabel,
  highlight = false,
}: {
  ranking: RankingUser
  valueLabel: string
  highlight?: boolean
}) {
  return (
    <UserInfoCard
      userId={ranking.user.id}
      userName={ranking.user.name}
      userAvatar={ranking.user.avatar}
      side="left"
      align="start"
    >
      <Card
        className={`mb-3 cursor-pointer transition-colors hover:bg-accent ${
          highlight ? "border-primary border-2" : ""
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <RankBadge rank={ranking.rank} />
            <Avatar className="h-12 w-12 sm:h-14 sm:w-14">
              <AvatarImage src={ranking.user.avatar} alt={ranking.user.name} />
              <AvatarFallback>
                {ranking.user.name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <div className="text-base font-semibold sm:text-lg">
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
          </div>
        </CardContent>
      </Card>
    </UserInfoCard>
  )
}

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
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {orderedRankings.map((ranking) => {
        const isFirst = ranking.rank === 1
        return (
          <div
            key={ranking.user.id}
            className={`flex flex-col items-center ${
              isFirst
                ? "sm:order-2"
                : ranking.rank === 2
                  ? "sm:order-1"
                  : "sm:order-3"
            }`}
          >
            <UserInfoCard
              userId={ranking.user.id}
              userName={ranking.user.name}
              userAvatar={ranking.user.avatar}
              side="bottom"
              align="center"
            >
              <div className="cursor-pointer transition-transform hover:scale-105">
                <div
                  className={`mb-3 flex items-center justify-center ${
                    isFirst ? "h-24 w-24" : "h-20 w-20"
                  }`}
                >
                  <RankBadge rank={ranking.rank} />
                </div>
                <Card
                  className={`border-2 ${
                    isFirst
                      ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                      : ranking.rank === 2
                        ? "border-gray-400 bg-gray-50 dark:bg-gray-900/20"
                        : "border-orange-600 bg-orange-50 dark:bg-orange-950/20"
                  }`}
                >
                  <CardContent className="p-4 text-center">
                    <Avatar
                      className={`mx-auto mb-3 ${
                        isFirst ? "h-20 w-20" : "h-16 w-16"
                      }`}
                    >
                      <AvatarImage
                        src={ranking.user.avatar}
                        alt={ranking.user.name}
                      />
                      <AvatarFallback className="text-xl">
                        {ranking.user.name.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`mb-2 font-semibold ${
                        isFirst ? "text-lg" : "text-base"
                      }`}
                    >
                      {ranking.user.name}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {valueLabel}
                      </span>
                      <span
                        className={`font-bold ${
                          isFirst ? "text-xl" : "text-lg"
                        }`}
                      >
                        {ranking.value.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
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
  const { data, error, isLoading } = useSWR<LeaderboardResponse>(
    `/api/leaderboard?type=${type}`,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 30000,
    }
  )

  // 获取当前用户信息
  const { data: currentUser } = useSWR<{ user: { id: string } } | null>(
    "/api/auth/me",
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) return null
      return res.json()
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-2 text-lg">{t("loading")}</div>
          <div className="text-sm text-muted-foreground">
            {t("loadingData")}
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

  if (!data || data.rankings.length === 0) {
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
  const topThree = data.rankings.slice(0, 3)
  const restRankings = data.rankings.slice(3)

  // 查找当前用户的排名（如果不在前三名中）
  const currentUserRanking = currentUser?.user?.id
    ? data.rankings.find((r) => r.user.id === currentUser.user.id)
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
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
            {t("fullLeaderboard")}
          </h3>
          <div className="space-y-2">
            {restRankings.map((ranking) => (
              <LeaderboardItem
                key={ranking.user.id}
                ranking={ranking}
                valueLabel={valueLabel}
                highlight={currentUser?.user?.id === ranking.user.id}
              />
            ))}
          </div>
        </div>
      )}

      {data.updatedAt && (
        <div className="pt-4 text-center text-xs text-muted-foreground">
          {t("lastUpdated")}：{new Date(data.updatedAt).toLocaleString("zh-CN")}
        </div>
      )}
    </div>
  )
}

export default function LeaderboardPage() {
  const t = useTranslations("Leaderboard")
  const [activeTab, setActiveTab] = useState<LeaderboardType>("wealth")

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="h-8 w-8" />
          <h1 className="text-2xl font-bold sm:text-3xl">{t("title")}</h1>
        </div>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as LeaderboardType)}
      >
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
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
