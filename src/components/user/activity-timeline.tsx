import { motion } from "motion/react"
import { useRef } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  FileText,
  MessageSquare,
  ThumbsUp,
  Bookmark,
  Eye,
  Hash,
  Activity as ActivityIcon,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CategoryBadge } from "@/components/common/category-badge"
import { TopicStatusTags } from "@/components/common/topic-status-tags"
import { RelativeTime } from "@/components/common/relative-time"
import { useTranslations } from "next-intl"
import Link from "next/link"
import type { ActivityItem, ActivityType } from "@/types/activity"
import { TopicType, type TopicTypeValue } from "@/types/topic-type"
import { Skeleton } from "@/components/ui/skeleton"
import type { RefObject } from "react"
import { ActivityFilter } from "./activity-filter"

type ActivityTimelineProps = {
  activities: ActivityItem[]
  activityType: ActivityType
  username: string
  hasMore: boolean
  hasPermission: boolean
  isLoading: boolean
  isLoadingMore: boolean
  sentinelRef: RefObject<HTMLDivElement | null>
}

function ActivityTimeline({
  activities,
  activityType,
  username,
  hasMore,
  hasPermission,
  isLoading,
  isLoadingMore,
  sentinelRef,
}: ActivityTimelineProps) {
  const ref = useRef(null)
  const t = useTranslations("User.profile.activity")

  // 获取活动类型图标
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "topics":
        return <FileText className="h-4 w-4" />
      case "posts":
        return <MessageSquare className="h-4 w-4" />
      case "likes":
        return <ThumbsUp className="h-4 w-4" />
      case "bookmarks":
        return <Bookmark className="h-4 w-4" />
      default:
        return <ActivityIcon className="h-4 w-4" />
    }
  }

  // 获取活动类型标签
  const getActivityLabel = (type: ActivityType) => {
    switch (type) {
      case "topics":
        return t("item.topic")
      case "posts":
        return t("item.post")
      case "likes":
        return t("item.like")
      case "bookmarks":
        return t("item.bookmark")
      default:
        return ""
    }
  }

  // 渲染主题活动
  const renderTopicContent = (activity: ActivityItem) => {
    if (!activity.topicData) return null
    const { topicId, title, category, type, views, repliesCount } =
      activity.topicData
    const topicType = (type || "GENERAL") as TopicTypeValue

    return (
      <Link href={`/topic/${topicId}`} className="block overflow-hidden">
        <h3 className="font-medium hover:text-primary transition-colors line-clamp-2 mb-2 whitespace-normal wrap-break-word">
          {title}
        </h3>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <CategoryBadge
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
      </Link>
    )
  }

  // 渲染帖子活动
  const renderPostContent = (activity: ActivityItem) => {
    if (!activity.postData) return null
    const {
      floorNumber,
      contentPreview,
      topicId,
      topicTitle,
      category,
      likesCount,
    } = activity.postData

    return (
      <Link
        href={`/topic/${topicId}#floor-${floorNumber}`}
        className="block overflow-hidden"
      >
        <h3 className="font-medium hover:text-primary transition-colors line-clamp-2 mb-2 whitespace-normal wrap-break-word">
          {topicTitle}
        </h3>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <CategoryBadge
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
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2 whitespace-normal wrap-break-word overflow-hidden">
          {contentPreview}
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ThumbsUp className="h-4 w-4" />
          <span>{likesCount}</span>
        </div>
      </Link>
    )
  }

  // 渲染点赞活动
  const renderLikeContent = (activity: ActivityItem) => {
    if (!activity.likeData) return null
    const {
      floorNumber,
      contentPreview,
      topicId,
      topicTitle,
      category,
      author,
    } = activity.likeData

    return (
      <Link
        href={`/topic/${topicId}#floor-${floorNumber}`}
        className="block overflow-hidden"
      >
        <h3 className="font-medium hover:text-primary transition-colors line-clamp-2 mb-2 whitespace-normal wrap-break-word">
          {topicTitle}
        </h3>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <CategoryBadge
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
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2 whitespace-normal wrap-break-word overflow-hidden">
          {contentPreview}
        </p>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={author.avatar} alt={author.name} />
            <AvatarFallback>{author.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{author.name}</span>
        </div>
      </Link>
    )
  }

  // 渲染收藏活动
  const renderBookmarkContent = (activity: ActivityItem) => {
    if (!activity.bookmarkData) return null
    const {
      floorNumber,
      contentPreview,
      topicId,
      topicTitle,
      category,
      author,
    } = activity.bookmarkData

    return (
      <Link
        href={`/topic/${topicId}#floor-${floorNumber}`}
        className="block overflow-hidden"
      >
        <h3 className="font-medium hover:text-primary transition-colors line-clamp-2 mb-2 whitespace-normal wrap-break-word">
          {topicTitle}
        </h3>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <CategoryBadge
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
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2 whitespace-normal wrap-break-word overflow-hidden">
          {contentPreview}
        </p>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={author.avatar} alt={author.name} />
            <AvatarFallback>{author.name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{author.name}</span>
        </div>
      </Link>
    )
  }

  // 渲染时间线骨架屏（包含时间线节点圆圈）
  const renderTimelineSkeleton = (count: number = 5) => {
    return (
      <>
        {[...Array(count)].map((_, i) => {
          const isEven = i % 2 === 0
          return (
            <div
              key={i}
              className={`relative flex items-center ${
                isEven ? "md:flex-row" : "md:flex-row-reverse"
              }`}
            >
              {/* 时间线节点骨架 */}
              <div className="absolute left-4 max-md:left-0 flex h-8 w-8 items-center justify-center md:left-1/2 md:-translate-x-1/2">
                <div className="h-8 w-8 rounded-full border-4 border-primary/30 flex items-center justify-center">
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
              </div>

              {/* 卡片骨架 */}
              <div
                className={`ml-16 w-full md:ml-0 md:w-5/12 min-w-0 ${
                  isEven ? "md:pr-8" : "md:pl-8"
                }`}
              >
                <Card className="relative overflow-hidden border-border/50 bg-card p-4 shadow-none md:p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </Card>
              </div>

              {/* Spacer */}
              <div className="hidden w-5/12 md:block" />
            </div>
          )
        })}
      </>
    )
  }

  // 渲染活动内容
  const renderActivityContent = (activity: ActivityItem) => {
    switch (activity.activityType) {
      case "topics":
        return renderTopicContent(activity)
      case "posts":
        return renderPostContent(activity)
      case "likes":
        return renderLikeContent(activity)
      case "bookmarks":
        return renderBookmarkContent(activity)
      default:
        return null
    }
  }

  // 初始加载骨架屏
  if (isLoading) {
    return (
      <section className="w-full bg-background py-8 max-sm:py-4">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-8 text-center md:mb-12">
            <Badge className="mb-4" variant="secondary">
              <Calendar className="mr-1 h-3 w-3" />
              {t("title")}
            </Badge>
            <h2 className="mb-4 text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
              {t("timelineTitle")}
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
              {t("timelineDescription")}
            </p>
          </div>

          {/* 筛选器 - loading 状态 */}
          <div className="mb-8">
            <ActivityFilter
              activeFilter={activityType}
              hasPermission={hasPermission}
              username={username}
              isLoading={true}
            />
          </div>

          {/* 时间线骨架屏 */}
          <div className="relative">
            {/* 垂直时间线 */}
            <div className="absolute left-4 top-0 h-full w-0.5 bg-linear-to-b from-primary/30 via-primary/20 to-primary/10 md:left-1/2 md:-translate-x-1/2" />

            <div className="space-y-8 md:space-y-12">
              {renderTimelineSkeleton()}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section ref={ref} className="w-full bg-background py-8 max-md:py-4">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 text-center md:mb-12"
        >
          <Badge className="mb-4" variant="secondary">
            <Calendar className="mr-1 h-3 w-3" />
            {t("title")}
          </Badge>
          <h2 className="mb-4 text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
            {t("timelineTitle")}
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
            {t("timelineDescription")}
          </p>
        </motion.div>

        {/* 筛选器 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <ActivityFilter
            activeFilter={activityType}
            hasPermission={hasPermission}
            username={username}
            isLoading={isLoading}
          />
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-lg font-semibold mb-2">
                {t(`empty.${activityType}`)}
              </h3>
            </div>
          ) : (
            <>
              {/* Vertical line */}
              <motion.div
                className="absolute left-4 top-0 h-full w-0.5 bg-linear-to-b from-primary via-primary/50 to-primary/20 md:left-1/2 md:-translate-x-1/2"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{ transformOrigin: "top" }}
              />

              <div className="space-y-8 md:space-y-12">
                {activities.map((activity, index) => {
                  const isEven = index % 2 === 0
                  return (
                    <motion.div
                      key={`${activity.activityType}-${index}`}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: (index % 10) * 0.1,
                        duration: 0.5,
                        ease: "easeOut",
                      }}
                      className={`relative flex items-center ${
                        isEven ? "md:flex-row" : "md:flex-row-reverse"
                      }`}
                    >
                      {/* Timeline node */}
                      <div className="absolute left-4 max-md:left-0 flex h-8 w-8 items-center justify-center md:left-1/2 md:-translate-x-1/2">
                        <motion.div
                          className="flex h-8 w-8 items-center justify-center rounded-full border-4 border-primary/30 bg-primary text-primary-foreground z-10"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: (index % 10) * 0.1 + 0.3,
                            type: "spring",
                          }}
                        >
                          {getActivityIcon(activity.activityType)}
                        </motion.div>
                        <motion.div
                          className="absolute h-8 w-8 rounded-full bg-primary/50"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: (index % 10) * 0.1,
                          }}
                        />
                      </div>

                      {/* Content card */}
                      <div
                        className={`ml-16 w-full md:ml-0 md:w-5/12 min-w-0 ${
                          isEven ? "md:pr-8" : "md:pl-8"
                        }`}
                      >
                        <motion.div
                          whileHover={{ scale: 1.02, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className="min-w-0"
                        >
                          <Card className="relative overflow-hidden border-border/50 bg-card p-4 shadow-none md:p-6">
                            <motion.div
                              className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300"
                              whileHover={{ opacity: 1 }}
                            />

                            <div className="relative min-w-0">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                {getActivityIcon(activity.activityType)}
                                <span>
                                  {getActivityLabel(activity.activityType)}
                                </span>
                                <span>·</span>
                                <Calendar className="h-3 w-3" />
                                <span>
                                  <RelativeTime date={activity.activityTime} />
                                </span>
                              </div>

                              {renderActivityContent(activity)}
                            </div>
                          </Card>
                        </motion.div>
                      </div>

                      {/* Spacer for alternating layout */}
                      <div className="hidden w-5/12 md:block" />
                    </motion.div>
                  )
                })}

                {/* 加载更多骨架屏 - 放在时间线内部 */}
                {isLoadingMore && renderTimelineSkeleton(3)}
              </div>

              {/* 滚动加载触发器 */}
              {hasMore && !isLoadingMore && (
                <div
                  ref={sentinelRef}
                  className="mt-8 h-20 flex items-center justify-center"
                >
                  <span className="text-sm text-muted-foreground">
                    {t("scrollLoadMore")}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* 没有更多数据 */}
        {!hasMore && activities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
            }}
            className="mt-12 text-center md:mt-16"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-primary"
              />
              <span className="text-sm font-medium">{t("allLoaded")}</span>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}

export default ActivityTimeline
