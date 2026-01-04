"use client"

import Link from "next/link"
import { motion } from "motion/react"
import {
  FileText,
  MessageSquare,
  ThumbsUp,
  Bookmark,
  Eye,
  Hash,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CategoryBadge } from "@/components/common/category-badge"
import { TopicStatusTags } from "@/components/common/topic-status-tags"
import { formatRelative } from "@/lib/time"
import { useTranslations } from "next-intl"
import type { ActivityItem as ActivityItemType } from "@/types/activity"
import { TopicType, type TopicTypeValue } from "@/types/topic-type"

type ActivityItemProps = {
  activity: ActivityItemType
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const t = useTranslations("User.profile.activity.item")

  const getIcon = () => {
    switch (activity.activityType) {
      case "topics":
        return <FileText className="h-5 w-5" />
      case "posts":
        return <MessageSquare className="h-5 w-5" />
      case "likes":
        return <ThumbsUp className="h-5 w-5" />
      case "bookmarks":
        return <Bookmark className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getActivityLabel = () => {
    switch (activity.activityType) {
      case "topics":
        return t("topic")
      case "posts":
        return t("post")
      case "likes":
        return t("like")
      case "bookmarks":
        return t("bookmark")
      default:
        return ""
    }
  }

  const renderTopicActivity = () => {
    if (!activity.topicData) return null
    const { topicId, title, category, type, views, repliesCount } =
      activity.topicData

    const topicType = (type || "GENERAL") as TopicTypeValue

    return (
      <Link href={`/topic/${topicId}`} className="block group">
        <Card className="shadow-none border hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-primary mt-1">{getIcon()}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-muted-foreground mb-1">
                  {getActivityLabel()} · {formatRelative(activity.activityTime)}
                </div>
                <h3 className="font-medium group-hover:text-primary transition-colors line-clamp-2 mb-2">
                  {title}
                </h3>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <CategoryBadge
                    id={category.id}
                    name={category.name}
                    icon={category.icon}
                    bgColor={category.bgColor}
                    textColor={category.textColor}
                  />
                  {topicType !== TopicType.GENERAL && (
                    <TopicStatusTags isPinned={false} topicType={topicType} />
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{repliesCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  const renderPostActivity = () => {
    if (!activity.postData) return null
    const {
      postId,
      floorNumber,
      contentPreview,
      topicId,
      topicTitle,
      category,
      likesCount,
    } = activity.postData

    return (
      <Link href={`/topic/${topicId}#post-${postId}`} className="block group">
        <Card className="shadow-none border hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-primary mt-1">{getIcon()}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-muted-foreground mb-1">
                  {getActivityLabel()} · {formatRelative(activity.activityTime)}
                </div>
                <h3 className="font-medium group-hover:text-primary transition-colors line-clamp-2 mb-2">
                  {topicTitle}
                </h3>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <CategoryBadge
                    id={category.id}
                    name={category.name}
                    icon={category.icon}
                    bgColor={category.bgColor}
                    textColor={category.textColor}
                  />
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    {floorNumber}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {contentPreview}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{likesCount}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  const renderLikeActivity = () => {
    if (!activity.likeData) return null
    const {
      postId,
      floorNumber,
      contentPreview,
      topicId,
      topicTitle,
      category,
      author,
    } = activity.likeData

    return (
      <Link href={`/topic/${topicId}#post-${postId}`} className="block group">
        <Card className="shadow-none border hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-primary mt-1">{getIcon()}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-muted-foreground mb-1">
                  {getActivityLabel()} · {formatRelative(activity.activityTime)}
                </div>
                <h3 className="font-medium group-hover:text-primary transition-colors line-clamp-2 mb-2">
                  {topicTitle}
                </h3>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <CategoryBadge
                    id={category.id}
                    name={category.name}
                    icon={category.icon}
                    bgColor={category.bgColor}
                    textColor={category.textColor}
                  />
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    {floorNumber}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {contentPreview}
                </p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={author.avatar} alt={author.name} />
                    <AvatarFallback>{author.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {author.name}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  const renderBookmarkActivity = () => {
    if (!activity.bookmarkData) return null
    const {
      postId,
      floorNumber,
      contentPreview,
      topicId,
      topicTitle,
      category,
      author,
    } = activity.bookmarkData

    return (
      <Link href={`/topic/${topicId}#post-${postId}`} className="block group">
        <Card className="shadow-none border hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-primary mt-1">{getIcon()}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-muted-foreground mb-1">
                  {getActivityLabel()} · {formatRelative(activity.activityTime)}
                </div>
                <h3 className="font-medium group-hover:text-primary transition-colors line-clamp-2 mb-2">
                  {topicTitle}
                </h3>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <CategoryBadge
                    id={category.id}
                    name={category.name}
                    icon={category.icon}
                    bgColor={category.bgColor}
                    textColor={category.textColor}
                  />
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    {floorNumber}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {contentPreview}
                </p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={author.avatar} alt={author.name} />
                    <AvatarFallback>{author.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {author.name}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  const renderActivity = () => {
    switch (activity.activityType) {
      case "topics":
        return renderTopicActivity()
      case "posts":
        return renderPostActivity()
      case "likes":
        return renderLikeActivity()
      case "bookmarks":
        return renderBookmarkActivity()
      default:
        return null
    }
  }

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      {renderActivity()}
    </motion.div>
  )
}
