import { motion } from "framer-motion"
import { FileText, Pin, Star, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"

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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ y: -4 }}
            className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur transition-all hover:border-border/60 hover:shadow-lg"
          >
            <div className="absolute inset-0 bg-linear-to-br from-foreground/4 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />

            <div className="relative flex items-center gap-4">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-xl ${stat.bgColor}`}
              >
                <Icon className={`h-7 w-7 ${stat.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground/60">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
