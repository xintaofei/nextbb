"use client"

import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Tag, TagIcon, Trash2, TrendingUp } from "lucide-react"

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
          className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur transition-all hover:border-border/60 hover:shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-foreground/4 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />

          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor}`}
            >
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold tracking-tight truncate">
                {stat.value}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
