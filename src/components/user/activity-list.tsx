"use client"

import { motion, Variants } from "motion/react"
import { Skeleton } from "@/components/ui/skeleton"
import { ActivityItem } from "./activity-item"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"
import type {
  ActivityItem as ActivityItemType,
  ActivityType,
} from "@/types/activity"

type ActivityListProps = {
  items: ActivityItemType[]
  isLoading: boolean
  activityType: ActivityType
  page: number
  hasMore: boolean
  onPageChange: (page: number) => void
}

// 容器动画
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

// 卡片动画
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
}

export function ActivityList({
  items,
  isLoading,
  activityType,
  page,
  hasMore,
  onPageChange,
}: ActivityListProps) {
  const t = useTranslations("User.profile.activity.empty")

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-lg font-semibold mb-2">{t(activityType)}</h3>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {items.map((item, index) => (
          <motion.div
            key={`${item.activityType}-${index}`}
            variants={cardVariants}
          >
            <ActivityItem activity={item} />
          </motion.div>
        ))}
      </motion.div>

      {/* 分页控制 */}
      <div className="flex items-center justify-center gap-2 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="max-sm:hidden ml-2">上一页</span>
        </Button>
        <span className="text-sm text-muted-foreground px-4">第 {page} 页</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasMore}
        >
          <span className="max-sm:hidden mr-2">下一页</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
