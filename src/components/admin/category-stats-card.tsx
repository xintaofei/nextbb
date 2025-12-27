"use client"

import { useTranslations } from "next-intl"
import { FolderOpen, FolderCheck, Trash2, TrendingUp } from "lucide-react"
import {
  StatsMetricGrid,
  StatsMetricCard,
} from "@/components/admin/stats-metric-card"

type CategoryStatsCardProps = {
  totalCategories: number
  activeCategories: number
  deletedCategories: number
  hottestCategory?: {
    name: string
    topicCount: number
  }
}

export function CategoryStatsCard({
  totalCategories,
  activeCategories,
  deletedCategories,
  hottestCategory,
}: CategoryStatsCardProps) {
  const t = useTranslations("AdminCategories")

  const stats = [
    {
      label: t("stats.total"),
      value: totalCategories,
      icon: FolderOpen,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: t("stats.active"),
      value: activeCategories,
      icon: FolderCheck,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: t("stats.deleted"),
      value: deletedCategories,
      icon: Trash2,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      label: t("stats.hottest"),
      value: hottestCategory
        ? `${hottestCategory.name} (${hottestCategory.topicCount})`
        : "-",
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
