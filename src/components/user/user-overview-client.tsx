"use client"

import useSWR from "swr"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Activity,
  MessageSquare,
  ThumbsUp,
  Heart,
  Bookmark,
  Award,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { TopContentSection } from "./top-content-section"
import { SocialInteractionSection } from "./social-interaction-section"

type OverviewStatsProps = {
  userId: string
}

type OverviewStatsData = {
  activeStats: {
    joinDays: number
    topicsCount: number
    postsCount: number
  }
  interactionStats: {
    likesGiven: number
    likesReceived: number
    bookmarksCount: number
    bookmarkedCount: number
  }
  honorStats: {
    badgesCount: number
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function UserOverviewClient({ userId }: OverviewStatsProps) {
  const t = useTranslations("User.profile.overview")
  const { data, error, isLoading } = useSWR<OverviewStatsData>(
    `/api/users/${userId}/overview-stats`,
    fetcher
  )

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            加载失败，请稍后再试
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 活跃指标 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t("activeStats.title")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("activeStats.joinDays")}
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.activeStats.joinDays}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.activeStats.joinDays > 0 ? "天" : "今天加入"}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("activeStats.topicsCreated")}
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.activeStats.topicsCount}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("activeStats.repliesCount")}
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.activeStats.postsCount}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 互动指标 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {t("interactionStats.title")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("interactionStats.likesGiven")}
              </CardTitle>
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.interactionStats.likesGiven}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("interactionStats.likesReceived")}
              </CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.interactionStats.likesReceived}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("interactionStats.bookmarksCount")}
              </CardTitle>
              <Bookmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.interactionStats.bookmarksCount}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("interactionStats.bookmarkedCount")}
              </CardTitle>
              <Bookmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.interactionStats.bookmarkedCount}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 荣誉指标 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t("honorStats.title")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t("honorStats.badgesCount")}
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.honorStats.badgesCount}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 热门内容区 */}
      <TopContentSection userId={userId} />

      {/* 社交互动排行 */}
      <SocialInteractionSection userId={userId} />
    </div>
  )
}
