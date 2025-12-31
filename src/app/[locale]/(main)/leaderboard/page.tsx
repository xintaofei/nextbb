"use client"

import { useState } from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import { Trophy, Medal, Award, TrendingUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserBadgesDisplay } from "@/components/common/user-badges-display"
import { encodeUsername } from "@/lib/utils"
import Link from "next/link"

type LeaderboardType = "wealth" | "pioneer" | "expert" | "reputation"

type BadgeItem = {
  id: string
  name: string
  icon: string
  level: number
  bgColor: string | null
  textColor: string | null
}

type RankingUser = {
  rank: number
  user: {
    id: string
    name: string
    avatar: string
  }
  value: number
  badges: BadgeItem[]
}

type LeaderboardResponse = {
  type: LeaderboardType
  rankings: RankingUser[]
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
}: {
  ranking: RankingUser
  valueLabel: string
}) {
  const encodedUsername = encodeUsername(ranking.user.name)

  return (
    <Link href={`/u/${encodedUsername}`}>
      <Card className="mb-3 cursor-pointer transition-colors hover:bg-accent">
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
                {ranking.badges.length > 0 && (
                  <div className="mt-1">
                    <UserBadgesDisplay
                      badges={ranking.badges}
                      size="sm"
                      maxDisplay={3}
                    />
                  </div>
                )}
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
    </Link>
  )
}

function LeaderboardList({
  type,
  valueLabel,
}: {
  type: LeaderboardType
  valueLabel: string
}) {
  const { data, error, isLoading } = useSWR<LeaderboardResponse>(
    `/api/leaderboard?type=${type}`,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 30000,
    }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-2 text-lg">加载中...</div>
          <div className="text-sm text-muted-foreground">
            正在获取排行榜数据
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-2 text-lg text-destructive">加载失败</div>
          <div className="text-sm text-muted-foreground">
            请稍后重试或刷新页面
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.rankings.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-2 text-lg">暂无排名数据</div>
          <div className="text-sm text-muted-foreground">
            快来参与社区活动，冲上排行榜吧！
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {data.rankings.map((ranking) => (
        <LeaderboardItem
          key={ranking.user.id}
          ranking={ranking}
          valueLabel={valueLabel}
        />
      ))}
      {data.updatedAt && (
        <div className="pt-4 text-center text-xs text-muted-foreground">
          最后更新时间：{new Date(data.updatedAt).toLocaleString("zh-CN")}
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
        <p className="mt-2 text-muted-foreground">
          社区排行榜展示不同维度的优秀用户
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as LeaderboardType)}
      >
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="wealth" className="flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">{t("wealth")}</span>
            <span className="sm:hidden">富豪</span>
          </TabsTrigger>
          <TabsTrigger value="pioneer" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">{t("pioneer")}</span>
            <span className="sm:hidden">先锋</span>
          </TabsTrigger>
          <TabsTrigger value="expert" className="flex items-center gap-1">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">{t("expert")}</span>
            <span className="sm:hidden">智囊</span>
          </TabsTrigger>
          <TabsTrigger value="reputation" className="flex items-center gap-1">
            <Medal className="h-4 w-4" />
            <span className="hidden sm:inline">{t("reputation")}</span>
            <span className="sm:hidden">声望</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wealth" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{t("wealth")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("wealthDesc")} - 基于用户当前的积分余额
            </p>
          </div>
          <LeaderboardList type="wealth" valueLabel={t("credits")} />
        </TabsContent>

        <TabsContent value="pioneer" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{t("pioneer")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("pioneerDesc")} - 基于近7天内的话题和帖子数量
            </p>
          </div>
          <LeaderboardList type="pioneer" valueLabel={t("activities")} />
        </TabsContent>

        <TabsContent value="expert" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{t("expert")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("expertDesc")} - 基于被采纳为最佳答案的次数
            </p>
          </div>
          <LeaderboardList type="expert" valueLabel={t("acceptances")} />
        </TabsContent>

        <TabsContent value="reputation" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{t("reputation")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("reputationDesc")} - 基于获得的点赞数和收藏数总和
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
