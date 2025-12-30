"use client"

import { useTranslations } from "next-intl"
import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Users, Gift, Trophy, Target } from "lucide-react"
import { cn } from "@/lib/utils"
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
      <Card className="w-full">
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
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            {data.isDrawn ? t("status.drawn") : t("status.pending")}
          </CardTitle>
          <Badge variant={data.isDrawn ? "secondary" : "default"}>
            {getDrawTypeLabel(data.drawType)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Draw info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="h-4 w-4" />
            <span>{getAlgorithmLabel(data.algorithmType)}</span>
            {getAlgorithmDescription() && (
              <span className="text-foreground">
                · {getAlgorithmDescription()}
              </span>
            )}
          </div>

          {data.drawType === "SCHEDULED" && data.endTime && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {t("endTime.label")}: {new Date(data.endTime).toLocaleString()}
              </span>
            </div>
          )}

          {data.drawType === "THRESHOLD" && data.participantThreshold && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {t("status.progress", {
                  current: data.replyCount,
                  threshold: data.participantThreshold,
                })}
              </span>
            </div>
          )}

          {data.entryCost > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span>
                {t("entryCost.label")}: {data.entryCost} {tc("credits")}
              </span>
            </div>
          )}

          {!data.isDrawn && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {tc("Table.replies")}: {data.replyCount}
              </span>
            </div>
          )}
        </div>

        {/* User participation status */}
        {data.userReplied && !data.isDrawn && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm text-blue-900 dark:text-blue-100">
            {t("success.participated")}
          </div>
        )}

        {data.userIsWinner && (
          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg text-sm text-green-900 dark:text-green-100 font-medium">
            🎉 {t("success.won")}
          </div>
        )}

        {data.userReplied && data.isDrawn && data.userIsWinner === false && (
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-600 dark:text-gray-400">
            {tc("notWon")}
          </div>
        )}

        {/* Winners list */}
        {data.isDrawn && data.winners && data.winners.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-medium">
              <Trophy className="h-4 w-4 text-yellow-600" />
              <span>
                {tc("winners")} ({data.winners.length})
              </span>
            </div>
            <div className="space-y-2">
              {data.winners.map((winner) => (
                <div
                  key={winner.userId}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={winner.userAvatar || undefined} />
                    <AvatarFallback>{winner.userName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {winner.userName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {tc("floor")}: #{winner.floorNumber}
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {new Date(winner.wonAt).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.isDrawn && (!data.winners || data.winners.length === 0) && (
          <div className="text-center py-6 text-muted-foreground">
            {tc("noWinners")}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
