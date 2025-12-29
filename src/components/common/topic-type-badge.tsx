"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { TopicType, type TopicTypeValue } from "@/types/topic-type"
import {
  MessageSquare,
  HelpCircle,
  Trophy,
  BarChart3,
  Gift,
  BookOpen,
} from "lucide-react"
import { useTranslations } from "next-intl"

export type TopicTypeBadgeProps = {
  type: TopicTypeValue
  className?: string
  showIcon?: boolean
  showText?: boolean
}

export function TopicTypeBadge({
  type,
  className,
  showIcon = true,
  showText = true,
}: TopicTypeBadgeProps) {
  const t = useTranslations("Topic.Type")

  // 如果 type 为空，默认为 GENERAL
  const safeType = type || TopicType.GENERAL

  const getTypeIcon = (type: TopicTypeValue) => {
    const iconClass = "h-3 w-3"
    switch (type) {
      case TopicType.GENERAL:
        return <MessageSquare className={iconClass} />
      case TopicType.QUESTION:
        return <HelpCircle className={iconClass} />
      case TopicType.BOUNTY:
        return <Trophy className={iconClass} />
      case TopicType.POLL:
        return <BarChart3 className={iconClass} />
      case TopicType.LOTTERY:
        return <Gift className={iconClass} />
      case TopicType.TUTORIAL:
        return <BookOpen className={iconClass} />
    }
  }

  const getTypeLabel = (type: TopicTypeValue): string => {
    switch (type) {
      case TopicType.GENERAL:
        return t("general")
      case TopicType.QUESTION:
        return t("question")
      case TopicType.BOUNTY:
        return t("bounty")
      case TopicType.POLL:
        return t("poll")
      case TopicType.LOTTERY:
        return t("lottery")
      case TopicType.TUTORIAL:
        return t("tutorial")
    }
  }

  const getTypeStyle = (type: TopicTypeValue) => {
    switch (type) {
      case TopicType.GENERAL:
        return "bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/40"
      case TopicType.QUESTION:
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40"
      case TopicType.BOUNTY:
        return "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40"
      case TopicType.POLL:
        return "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/40"
      case TopicType.LOTTERY:
        return "bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/40"
      case TopicType.TUTORIAL:
        return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/40"
    }
  }

  const typeLabel = getTypeLabel(safeType)
  const description = t(`description.${safeType.toLowerCase()}`)

  return (
    <Badge
      variant="secondary"
      className={cn("gap-1", getTypeStyle(safeType), className)}
      title={description}
    >
      {showIcon && getTypeIcon(safeType)}
      {showText && <span>{typeLabel}</span>}
    </Badge>
  )
}
