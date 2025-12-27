"use client"

import { useTranslations } from "next-intl"
import { Award, Check, X, Trash2, BarChart3 } from "lucide-react"
import {
  StatsMetricGrid,
  StatsMetricCard,
} from "@/components/admin/stats/stats-metric-card"
import { AdminPageSection } from "@/components/admin/layout/admin-page-section"

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
    <>
      <AdminPageSection delay={0.1}>
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
      </AdminPageSection>

      {typeDistribution && Object.keys(typeDistribution).length > 0 && (
        <AdminPageSection
          delay={0.15}
          className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur"
        >
          <div className="absolute inset-0 bg-linear-to-br from-foreground/4 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />

          <div className="relative space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-foreground/60" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-foreground">
                {t("stats.byType")}
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {Object.entries(typeDistribution).map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-background/60 px-3 py-2.5 transition-colors hover:bg-background/80"
                >
                  <span className="text-sm text-foreground/70">
                    {t(`badgeType.${type}`)}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </AdminPageSection>
      )}
    </>
  )
}
