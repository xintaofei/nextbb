"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { CalendarCheck, Loader2, Trophy } from "lucide-react"
import useSWR, { mutate } from "swr"
import { Button } from "@/components/ui/button"
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

const statusFetcher = async (url: string): Promise<CheckinStatus | null> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return null
  return res.json()
}

const listFetcher = async (url: string): Promise<CheckinRecord[]> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return []
  const data = await res.json()
  return data.checkins || []
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
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {orderedCheckins.map((checkin) => {
        const isFirst = checkin.rank === 1
        return (
          <div
            key={checkin.id}
            className={`flex flex-col items-center ${
              isFirst
                ? "sm:order-2"
                : checkin.rank === 2
                  ? "sm:order-1"
                  : "sm:order-3"
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
                  className={`mb-3 flex items-center justify-center ${
                    isFirst ? "size-24" : "size-20"
                  }`}
                >
                  <RankBadge rank={checkin.rank} />
                </div>
                <Card className="relative shadow-none overflow-hidden py-12">
                  <CardContent className="min-w-40 px-8 text-center">
                    <Avatar className="mx-auto mb-3 size-16">
                      <AvatarImage
                        src={checkin.user.avatar}
                        alt={checkin.user.name}
                      />
                      <AvatarFallback className="text-xl">
                        {checkin.user.name.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`mb-2 font-semibold ${
                        isFirst ? "text-lg" : "text-base"
                      }`}
                    >
                      {checkin.user.name}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Badge variant="secondary">
                        +{checkin.creditsEarned} {t("credits")}
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
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

export function CheckinSection() {
  const t = useTranslations("Checkin")
  const [isChecking, setIsChecking] = useState(false)

  // 获取用户时区偏移量（分钟）
  const timezoneOffset = new Date().getTimezoneOffset()

  const { data: checkinStatus } = useSWR<CheckinStatus | null>(
    "/api/checkin",
    statusFetcher,
    {
      refreshInterval: 60000,
    }
  )

  const { data: todayCheckins = [], mutate: mutateList } = useSWR<
    CheckinRecord[]
  >(`/api/checkin?list=today&timezoneOffset=${timezoneOffset}`, listFetcher, {
    refreshInterval: 30000,
  })

  const handleCheckin = async () => {
    try {
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
        // 刷新签到状态、签到列表和用户信息
        mutate("/api/checkin")
        mutateList()
        mutate("/api/auth/me")
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

  const topThree = todayCheckins.slice(0, 3)
  const restCheckins = todayCheckins.slice(3)

  return (
    <div className="space-y-6">
      {/* 签到卡片 */}
      <div className="flex flex-col justify-center items-center gap-8 max-sm:gap-4">
        <span className="flex items-center gap-2 text-4xl font-medium">
          <CalendarCheck className="size-10" />
          {t("title")}
        </span>
        <span className="text-muted-foreground">{t("description")}</span>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button
            onClick={handleCheckin}
            disabled={isChecking || hasCheckedIn}
            variant={hasCheckedIn ? "secondary" : "default"}
            size="lg"
            className="w-full sm:w-auto"
          >
            {isChecking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("checking")}
              </>
            ) : (
              <>
                <CalendarCheck className="mr-2 h-4 w-4" />
                {hasCheckedIn ? t("checkedIn") : t("button")}
              </>
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

        {hasCheckedIn && checkinStatus?.todayCheckin && (
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              {t("todayEarned", {
                credits: checkinStatus.todayCheckin.creditsEarned,
              })}
            </p>
          </div>
        )}

        {!hasCheckedIn && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm">{t("earnCredits", { credits: 10 })}</p>
          </div>
        )}
      </div>

      {/* 今日签到列表 */}
      <div className="mt-16 max-sm:mt-8">
        <div className="flex flex-col gap-2 items-center">
          <span className="flex items-center gap-1 text-2xl font-medium">
            <Trophy className="size-5" />
            {t("todayList")}
          </span>
          <span className="text-muted-foreground">
            {t("todayListDescription", { count: todayCheckins.length })}
          </span>
        </div>
        <div className="mt-8 max-sm:mt-4">
          {todayCheckins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CalendarCheck className="mb-4 h-12 w-12 opacity-20" />
              <p>{t("noCheckinToday")}</p>
            </div>
          ) : (
            <div>
              {/* 前三名特殊展示 */}
              {topThree.length > 0 && <TopThreeDisplay checkins={topThree} />}

              {/* 其余用户列表 */}
              {restCheckins.length > 0 && (
                <div className="space-y-2">
                  {restCheckins.map((checkin) => (
                    <CheckinItem key={checkin.id} checkin={checkin} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
