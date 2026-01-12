"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Coins, Users, Award } from "lucide-react"
import { useTranslations } from "next-intl"
import { RelativeTime } from "@/components/common/relative-time"
import useSWR from "swr"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BountyType } from "@/types/topic-type"

type BountyReward = {
  id: string
  postId: string
  receiver: {
    id: string
    name: string
    avatar: string
  }
  amount: number
  createdAt: string
}

type BountyConfigData = {
  topicId: string
  bountyTotal: number
  bountyType: string
  bountySlots: number
  remainingSlots: number
  singleAmount: number | null
  rewards: BountyReward[]
}

type BountyDisplayProps = {
  topicId: string
  topicIsSettled?: boolean
}

export function BountyDisplay({
  topicId,
  topicIsSettled = false,
}: BountyDisplayProps) {
  const t = useTranslations("Topic.Bounty")

  const fetcher = async (url: string): Promise<BountyConfigData> => {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to load bounty config")
    return await res.json()
  }

  const { data, isLoading, error } = useSWR<BountyConfigData>(
    `/api/topic/${topicId}/bounty`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  if (isLoading) {
    return (
      <Card className="mb-6 shadow-none">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return null
  }

  const isSingleBounty = data.bountyType === BountyType.SINGLE
  const isFullyRewarded = data.remainingSlots === 0

  return (
    <Card className="border-amber-200 dark:border-amber-900/50 bg-linear-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <Coins className="h-5 w-5" />
          {t("info.title")}
          {(topicIsSettled || isFullyRewarded) && (
            <Badge variant="secondary" className="ml-2">
              {t("status.settled")}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 悬赏基本信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-900/20">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                {t("info.totalAmount")}
              </div>
              <div className="text-lg font-bold text-amber-700 dark:text-amber-400">
                {data.bountyTotal}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-900/20">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                {t("info.bountyType")}
              </div>
              <div className="text-base font-semibold">
                {isSingleBounty ? t("single") : t("multiple")}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-900/20">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                {t("info.remainingSlots")}
              </div>
              <div className="text-lg font-bold">
                {data.remainingSlots}/{data.bountySlots}
              </div>
            </div>
          </div>

          {!isSingleBounty && data.singleAmount && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-900/20">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Coins className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  {t("info.singleAmount")}
                </div>
                <div className="text-lg font-bold text-purple-700 dark:text-purple-400">
                  {data.singleAmount}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 已获赏名单 */}
        {data.rewards.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-muted-foreground">
              {t("info.rewardedList")} ({data.rewards.length})
            </div>
            <div className="space-y-2">
              {data.rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/60 dark:bg-gray-900/30 border border-amber-100 dark:border-amber-900/30"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={reward.receiver.avatar}
                        alt={reward.receiver.name}
                      />
                      <AvatarFallback>
                        {reward.receiver.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{reward.receiver.name}</div>
                      <div className="text-xs text-muted-foreground">
                        <RelativeTime date={reward.createdAt} />
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  >
                    +{reward.amount}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 未获赏提示 */}
        {data.rewards.length === 0 && (
          <Alert className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              {t("info.noRewardsYet", {
                defaultValue: "暂无获赏记录，快来回答问题吧！",
              })}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
