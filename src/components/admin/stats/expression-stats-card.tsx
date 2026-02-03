"use client"

import { useTranslations } from "next-intl"
import { Folder, Smile, Image } from "lucide-react"
import {
  StatsMetricGrid,
  StatsMetricCard,
} from "@/components/admin/stats/stats-metric-card"

type ExpressionStatsCardProps = {
  totalGroups: number
  totalExpressions: number
  imageExpressions: number
  textExpressions: number
}

export function ExpressionStatsCard({
  totalGroups,
  totalExpressions,
  imageExpressions,
}: ExpressionStatsCardProps) {
  const t = useTranslations("AdminExpressions")

  const stats = [
    {
      label: t("stats.totalGroups"),
      value: totalGroups,
      icon: Folder,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: t("stats.totalExpressions"),
      value: totalExpressions,
      icon: Smile,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: t("stats.imageExpressions"),
      value: imageExpressions,
      icon: Image,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
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
