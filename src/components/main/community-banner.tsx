"use client"

import { Fragment, memo } from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import { useConfig } from "@/components/providers/config-provider"
import { Skeleton } from "@/components/ui/skeleton"

interface StatsData {
  users: number
  topics: number
  posts: number
  interactions: number
}

const fetcher = async (url: string): Promise<StatsData> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch stats")
  return res.json()
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k"
  }
  return String(num)
}

export const CommunityBanner = memo(function CommunityBanner() {
  const { configs } = useConfig()
  const t = useTranslations("Common.Stats")
  const tIndex = useTranslations("Index")
  const { data, isLoading } = useSWR<StatsData>(
    "/api/stats/overview",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )

  const forumName = configs["basic.name"] || "NextBB"
  const welcomeMessage =
    (configs["basic.welcome_message"] as string) || tIndex("title")

  const statItems = [
    { label: t("topics"), value: data?.topics ?? 0 },
    { label: t("posts"), value: data?.posts ?? 0 },
    { label: t("users"), value: data?.users ?? 0 },
    {
      label: t("interactions"),
      value: data?.interactions ?? 0,
    },
  ]

  return (
    <div className="flex flex-col items-center gap-8 border-b p-8 bg-linear-to-b from-muted-foreground/5 to-card max-sm:hidden">
      {/* 论坛名称 + 欢迎信息 */}
      <div className="flex flex-col gap-2 items-center">
        <h1 className="text-6xl font-bold leading-tight">{forumName}</h1>
        <p className="text-xl line-clamp-1">{welcomeMessage}</p>
      </div>
      {/* 统计数据 */}
      <div className="flex items-center justify-center gap-4">
        {statItems.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 && <div className="h-4 w-px bg-border rotate-25" />}
            <div className="flex items-center gap-1.5 bg-muted px-4 py-1 rounded-full border">
              <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-foreground" />
              <span className="text-xs text-primary/80">{item.label}</span>
              {isLoading ? (
                <Skeleton className="size-4 bg-primary/60" />
              ) : (
                <span className="text-xs font-medium tabular-nums text-primary/80">
                  {formatNumber(item.value)}
                </span>
              )}
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
})
