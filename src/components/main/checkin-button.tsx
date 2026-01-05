"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { CalendarCheck, Loader2 } from "lucide-react"
import useSWR, { mutate } from "swr"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type CheckinStatus = {
  hasCheckedInToday: boolean
  consecutiveDays: number
  monthlyCheckins: number
  todayCheckin: {
    date: string
    creditsEarned: number
  } | null
}

const fetcher = async (url: string): Promise<CheckinStatus | null> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return null
  return res.json()
}

export function CheckinButton() {
  const t = useTranslations("Checkin")
  const [isChecking, setIsChecking] = useState(false)

  const { data: checkinStatus } = useSWR<CheckinStatus | null>(
    "/api/checkin",
    fetcher,
    {
      refreshInterval: 60000, // 每分钟刷新一次
    }
  )

  const handleCheckin = async () => {
    try {
      setIsChecking(true)
      const res = await fetch("/api/checkin", {
        method: "POST",
      })

      const result = await res.json()

      if (res.ok) {
        toast.success(t("success", { credits: result.creditsEarned }))
        // 刷新签到状态和用户信息
        mutate("/api/checkin")
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

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleCheckin}
            disabled={isChecking || hasCheckedIn}
            variant={hasCheckedIn ? "secondary" : "default"}
            size="sm"
            className="w-full justify-start gap-2"
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CalendarCheck className="h-4 w-4" />
            )}
            <span>{hasCheckedIn ? t("checkedIn") : t("button")}</span>
            {hasCheckedIn && (
              <span className="ml-auto text-xs text-muted-foreground">
                {t("earnCredits", { credits: 10 })}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex flex-col gap-1">
          <p className="font-semibold">{t("title")}</p>
          {consecutiveDays > 0 && (
            <p className="text-xs text-muted-foreground">
              {t("consecutiveDays", { days: consecutiveDays })}
            </p>
          )}
          {monthlyCheckins > 0 && (
            <p className="text-xs text-muted-foreground">
              {t("monthlyCheckins", { days: monthlyCheckins })}
            </p>
          )}
          {!hasCheckedIn && (
            <p className="text-xs text-muted-foreground">
              {t("earnCredits", { credits: 10 })}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
