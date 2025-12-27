"use client"

import { useTranslations } from "next-intl"
import { Tag, TagIcon, Trash2, TrendingUp } from "lucide-react"
import {
  StatsMetricGrid,
  StatsMetricCard,
} from "@/components/admin/stats/stats-metric-card"

type TagStatsCardProps = {
  totalTags: number
  activeTags: number
  deletedTags: number
  hottestTag?: {
    name: string
    usageCount: number
  }
}

export function TagStatsCard({
  totalTags,
  activeTags,
  deletedTags,
  hottestTag,
}: TagStatsCardProps) {
  const t = useTranslations("AdminTags")

  const stats = [
    {
      label: t("stats.total"),
      value: totalTags,
      icon: Tag,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: t("stats.active"),
      value: activeTags,
      icon: TagIcon,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: t("stats.deleted"),
      value: deletedTags,
      icon: Trash2,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      label: t("stats.hottest"),
      value: hottestTag ? `${hottestTag.name} (${hottestTag.usageCount})` : "-",
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ]

  return (
    <StatsMetricGrid>
      {stats.map((stat) => (
        <StatsMetricCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          iconColor={stat.color}
        />
      ))}
    </StatsMetricGrid>
  )
}
