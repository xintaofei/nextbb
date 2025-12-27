import { useTranslations } from "next-intl"
import { FileText, Pin, Star, Trash2 } from "lucide-react"
import {
  StatsMetricGrid,
  StatsMetricCard,
} from "@/components/admin/stats/stats-metric-card"

export interface TopicStatsCardProps {
  totalTopics: number
  pinnedTopics: number
  communityTopics: number
  deletedTopics: number
}

export function TopicStatsCard({
  totalTopics,
  pinnedTopics,
  communityTopics,
  deletedTopics,
}: TopicStatsCardProps) {
  const t = useTranslations("AdminTopics.stats")

  const stats = [
    {
      label: t("total"),
      value: totalTopics,
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/20",
    },
    {
      label: t("pinned"),
      value: pinnedTopics,
      icon: Pin,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-500/20",
    },
    {
      label: t("community"),
      value: communityTopics,
      icon: Star,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/20",
    },
    {
      label: t("deleted"),
      value: deletedTopics,
      icon: Trash2,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-500/20",
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
