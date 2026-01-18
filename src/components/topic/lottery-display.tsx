"use client"

import { useTranslations } from "next-intl"
import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, Users, Gift, Target } from "lucide-react"
import type { LotteryConfig, LotteryWinner } from "@/types/topic-type"

type LotteryDisplayProps = {
  topicId: string
}

type LotteryResponse = LotteryConfig & {
  winners?: LotteryWinner[]
}

export function LotteryDisplay({ topicId }: LotteryDisplayProps) {
  const t = useTranslations("Topic.Lottery")
  const tc = useTranslations("Common")

  const { data, isLoading } = useSWR<LotteryResponse>(
    `/api/topic/${topicId}/lottery`,
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch lottery data")
      return res.json()
    }
  )

  if (isLoading || !data) {
    return (
      <Card className="w-full shadow-none">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getDrawTypeLabel = (drawType: string) => {
    switch (drawType) {
      case "SCHEDULED":
        return t("drawType.scheduled")
      case "THRESHOLD":
        return t("drawType.threshold")
      case "INSTANT":
        return t("drawType.instant")
      default:
        return drawType
    }
  }

  const getAlgorithmLabel = (algorithmType: string) => {
    switch (algorithmType) {
      case "INTERVAL":
        return t("algorithmType.interval")
      case "RANDOM":
        return t("algorithmType.random")
      case "FIXED":
        return t("algorithmType.fixed")
      default:
        return algorithmType
    }
  }

  const getAlgorithmDescription = () => {
    if (data.algorithmType === "INTERVAL" && data.floorInterval) {
      return `${t("floorInterval.label")}: ${data.floorInterval}`
    }
    if (data.algorithmType === "RANDOM" && data.winnerCount) {
      return `${t("winnerCount.label")}: ${data.winnerCount}`
    }
    if (data.algorithmType === "FIXED" && data.fixedFloors) {
      return `${t("fixedFloors.label")}: ${data.fixedFloors.join(", ")}`
    }
    return ""
  }

  return (
    <Card className="border-purple-200 dark:border-purple-900/50 bg-linear-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
          <Gift className="h-5 w-5" />
          {t("info.title")}
          {data.isDrawn && (
            <Badge variant="secondary" className="ml-2">
              {t("status.drawn")}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 抽奖基本信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-900/20">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
              <Badge className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                {t("drawType.label")}
              </div>
              <div className="text-base font-semibold">
                {getDrawTypeLabel(data.drawType)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-900/20">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                {t("algorithmType.label")}
              </div>
              <div className="text-base font-semibold">
                {getAlgorithmLabel(data.algorithmType)}
              </div>
            </div>
          </div>

          {/* 参与门槛 */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                {t("participation.method")}
              </div>
              <div className="text-base font-semibold text-blue-900 dark:text-blue-100">
                {data.entryCost > 0
                  ? t("participation.replyAndCost", { cost: data.entryCost })
                  : t("participation.replyToJoin")}
              </div>
            </div>
          </div>
        </div>

        {/* 抽奖详细信息 */}
        <div className="space-y-2">
          {data.drawType === "SCHEDULED" && data.endTime && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-white/60 dark:bg-gray-900/30">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {t("endTime.label")}: {new Date(data.endTime).toLocaleString()}
              </span>
            </div>
          )}

          {data.drawType === "THRESHOLD" && data.participantThreshold && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-white/60 dark:bg-gray-900/30">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {t("status.progress", {
                  current: data.replyCount,
                  threshold: data.participantThreshold,
                })}
              </span>
            </div>
          )}

          {getAlgorithmDescription() && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-white/60 dark:bg-gray-900/30">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{getAlgorithmDescription()}</span>
            </div>
          )}

          {!data.isDrawn && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-white/60 dark:bg-gray-900/30">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {tc("Table.replies")}: {data.replyCount}
              </span>
            </div>
          )}
        </div>

        {/* 用户参与状态 */}
        {data.userReplied && !data.isDrawn && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-sm text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-900/50">
            {t("success.participated")}
          </div>
        )}

        {data.userIsWinner && (
          <div className="p-3 bg-green-50 dark:bg-green-950/50 rounded-lg text-sm text-green-900 dark:text-green-100 font-medium border border-green-200 dark:border-green-900/50">
            🎉 {t("success.won")}
          </div>
        )}

        {data.userReplied && data.isDrawn && data.userIsWinner === false && (
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800">
            {tc("notWon")}
          </div>
        )}

        {/* 中奖名单 */}
        {data.isDrawn && data.winners && data.winners.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-muted-foreground">
              {tc("winners")} ({data.winners.length})
            </div>
            <div className="space-y-2">
              {data.winners.map((winner) => (
                <div
                  key={winner.userId}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/60 dark:bg-gray-900/30 border border-purple-100 dark:border-purple-900/30"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={winner.userAvatar || undefined}
                        alt={winner.userName}
                      />
                      <AvatarFallback>
                        {winner.userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{winner.userName}</div>
                      <div className="text-xs text-muted-foreground">
                        {tc("floor")}: #{winner.floorNumber}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                  >
                    {new Date(winner.wonAt).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.isDrawn && (!data.winners || data.winners.length === 0) && (
          <Alert className="border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20">
            <AlertDescription className="text-purple-800 dark:text-purple-300">
              {tc("noWinners")}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
