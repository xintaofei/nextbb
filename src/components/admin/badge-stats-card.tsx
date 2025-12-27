"use client"

import { useTranslations } from "next-intl"
import { Award, Check, X, Trash2, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  StatsMetricGrid,
  StatsMetricCard,
} from "@/components/admin/stats-metric-card"

type BadgeStatsCardProps = {
  totalBadges: number
  enabledBadges: number
  disabledBadges: number
  deletedBadges: number
  typeDistribution?: Record<string, number>
}

export function BadgeStatsCard({
  totalBadges,
  enabledBadges,
  disabledBadges,
  deletedBadges,
  typeDistribution,
}: BadgeStatsCardProps) {
  const t = useTranslations("AdminBadges")

  const stats = [
    {
      label: t("stats.total"),
      value: totalBadges,
      icon: Award,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
    },
    {
      label: t("stats.enabled"),
      value: enabledBadges,
      icon: Check,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/50",
    },
    {
      label: t("stats.disabled"),
      value: disabledBadges,
      icon: X,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/50",
    },
    {
      label: t("stats.deleted"),
      value: deletedBadges,
      icon: Trash2,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950/50",
    },
  ]

  return (
    <div className="space-y-4">
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

      {typeDistribution && Object.keys(typeDistribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              {t("stats.byType")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {Object.entries(typeDistribution).map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-background/60 px-3 py-2"
                >
                  <span className="text-sm text-foreground/70">
                    {t(`badgeType.${type}`)}
                  </span>
                  <span className="text-sm font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
