import { motion } from "framer-motion"
import { Users, UserCheck, Shield, UserX } from "lucide-react"
import { useTranslations } from "next-intl"

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
      icon: <Users className="h-6 w-6 text-primary" aria-hidden="true" />,
    },
    {
      key: "active",
      value: activeUsers.toLocaleString(),
      icon: (
        <UserCheck
          className="h-6 w-6 text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        />
      ),
    },
    {
      key: "admin",
      value: adminUsers.toLocaleString(),
      icon: (
        <Shield
          className="h-6 w-6 text-violet-600 dark:text-violet-400"
          aria-hidden="true"
        />
      ),
    },
    {
      key: "deleted",
      value: deletedUsers.toLocaleString(),
      icon: (
        <UserX
          className="h-6 w-6 text-red-600 dark:text-red-400"
          aria-hidden="true"
        />
      ),
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          whileHover={{ y: -4 }}
          className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur transition-all hover:border-border/60 hover:shadow-lg"
          role="article"
          aria-label={`${t(stat.key)}: ${stat.value}`}
        >
          <div className="absolute inset-0 bg-linear-to-br from-foreground/4 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />

          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-2xl" aria-hidden="true">
                {stat.icon}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/40">
                {t(stat.key)}
              </p>
              <p className="text-2xl font-semibold tracking-tight text-foreground">
                {stat.value}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
