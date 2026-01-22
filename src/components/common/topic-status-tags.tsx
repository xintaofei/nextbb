"use client"

import { cn } from "@/lib/utils"
import { TopicType, type TopicTypeValue } from "@/types/topic-type"
import {
  Pin,
  Star,
  HelpCircle,
  Trophy,
  BarChart3,
  Gift,
  BookOpen,
} from "lucide-react"
import { useTranslations } from "next-intl"

export type TopicStatusTagsProps = {
  isPinned: boolean
  isCommunity?: boolean
  topicType: TopicTypeValue
  size?: string
  className?: string
}

export function TopicStatusTags({
  isPinned,
  isCommunity,
  topicType,
  size,
  className,
}: TopicStatusTagsProps) {
  const t = useTranslations("Topic.Type")

  // 如果类型为 GENERAL 且未置顶,则不显示任何内容
  if (!isPinned && topicType === TopicType.GENERAL) {
    return null
  }

  const getTypeIcon = (type: TopicTypeValue) => {
    const iconClass = size || "size-4"
    switch (type) {
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
      default:
        return null
    }
  }

  const getTypeLabel = (type: TopicTypeValue): string => {
    switch (type) {
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
      default:
        return ""
    }
  }

  const getTypeStyle = (type: TopicTypeValue) => {
    switch (type) {
      case TopicType.QUESTION:
        return "text-muted-foreground"
      case TopicType.BOUNTY:
        return "text-muted-foreground"
      case TopicType.POLL:
        return "text-muted-foreground"
      case TopicType.LOTTERY:
        return "text-muted-foreground"
      case TopicType.TUTORIAL:
        return "text-muted-foreground"
      default:
        return "text-muted-foreground"
    }
  }

  const typeIcon = getTypeIcon(topicType)
  const typeLabel = getTypeLabel(topicType)
  const typeStyle = getTypeStyle(topicType)
  const typeDescription =
    topicType !== TopicType.GENERAL
      ? t(`description.${topicType.toLowerCase()}`)
      : ""

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      {/* 置顶图标 - 优先显示在最左侧 */}
      {isPinned && (
        <span className="text-muted-foreground" title="Pin">
          <Pin className={size || "size-4"} />
        </span>
      )}
      {/* 推荐图标 - 显示在置顶图标之后 */}
      {isCommunity && (
        <span className="text-amber-500" title="Community">
          <Star className={size || "size-4"} />
        </span>
      )}
      {/* 类型 Badge - 只在非 GENERAL 类型时显示 */}
      {topicType !== TopicType.GENERAL && (
        <span className={typeStyle} title={typeLabel + ": " + typeDescription}>
          {typeIcon}
        </span>
      )}
    </div>
  )
}
