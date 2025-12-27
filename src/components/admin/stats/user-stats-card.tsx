import { useTranslations } from "next-intl"
import { Users, UserCheck, Shield, UserX } from "lucide-react"
import {
  StatsMetricGrid,
  StatsMetricCard,
} from "@/components/admin/stats/stats-metric-card"

export interface UserStatsCardProps {
  totalUsers: number
  activeUsers: number
  adminUsers: number
  deletedUsers: number
}

export function UserStatsCard({
  totalUsers,
  activeUsers,
  adminUsers,
  deletedUsers,
}: UserStatsCardProps) {
  const t = useTranslations("AdminUsers.stats")

  const stats = [
    {
      key: "total",
      value: totalUsers.toLocaleString(),
      icon: Users,
      iconColor: "text-primary",
    },
    {
      key: "active",
      value: activeUsers.toLocaleString(),
      icon: UserCheck,
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      key: "admin",
      value: adminUsers.toLocaleString(),
      icon: Shield,
      iconColor: "text-violet-600 dark:text-violet-400",
    },
    {
      key: "deleted",
      value: deletedUsers.toLocaleString(),
      icon: UserX,
      iconColor: "text-red-600 dark:text-red-400",
    },
  ]

  return (
    <StatsMetricGrid>
      {stats.map((stat) => (
        <StatsMetricCard
          key={stat.key}
          label={t(stat.key)}
          value={stat.value}
          icon={stat.icon}
          iconColor={stat.iconColor}
        />
      ))}
    </StatsMetricGrid>
  )
}
