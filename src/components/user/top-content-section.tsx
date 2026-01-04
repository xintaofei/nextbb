"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations } from "next-intl"
import { Eye, Heart } from "lucide-react"
import Link from "next/link"

interface TopicItem {
  id: string
  title: string
  createdAt: string
  views: number
  likesCount: number
}

interface ReplyItem {
  id: string
  contentPreview: string
  topicId: string
  topicTitle: string
  createdAt: string
  likesCount: number
  floorNumber: number
}

interface TopContentData {
  topTopics: TopicItem[]
  topReplies: ReplyItem[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      return `${diffInMinutes}分钟前`
    }
    return `${diffInHours}小时前`
  } else if (diffInDays < 7) {
    return `${diffInDays}天前`
  } else {
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`
  }
  return num.toString()
}

function TopicItemCard({ topic }: { topic: TopicItem }) {
  return (
    <Link
      href={`/topic/${topic.id}`}
      className="block rounded-lg border p-4 transition-colors hover:bg-accent"
    >
      <h3 className="mb-2 line-clamp-2 font-medium">{topic.title}</h3>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{formatDate(topic.createdAt)}</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {formatNumber(topic.views)}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {formatNumber(topic.likesCount)}
          </span>
        </div>
      </div>
    </Link>
  )
}

function ReplyItemCard({ reply }: { reply: ReplyItem }) {
  const t = useTranslations("User.profile.overview.topContent")

  return (
    <Link
      href={`/topic/${reply.topicId}?floor=${reply.floorNumber}`}
      className="block rounded-lg border p-4 transition-colors hover:bg-accent"
    >
      <p className="mb-2 line-clamp-3 text-sm">{reply.contentPreview}</p>
      <div className="mb-2 text-sm text-muted-foreground">
        {t("inTopic")}: <span className="font-medium">{reply.topicTitle}</span>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{formatDate(reply.createdAt)}</span>
        <span className="flex items-center gap-1">
          <Heart className="h-4 w-4" />
          {formatNumber(reply.likesCount)}
        </span>
      </div>
    </Link>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border p-4">
          <Skeleton className="mb-2 h-5 w-full" />
          <Skeleton className="mb-2 h-5 w-3/4" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TopContentSection({ userId }: { userId: string }) {
  const t = useTranslations("User.profile.overview.topContent")
  const { data, error, isLoading } = useSWR<TopContentData>(
    `/api/users/${userId}/top-content`,
    fetcher
  )

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-sm text-destructive">
        Failed to load top content
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 热门主题 */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>{t("topTopics")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSkeleton />
          ) : data && data.topTopics.length > 0 ? (
            <div className="space-y-3">
              {data.topTopics.map((topic) => (
                <TopicItemCard key={topic.id} topic={topic} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("emptyTopics")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 热门回复 */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>{t("topReplies")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSkeleton />
          ) : data && data.topReplies.length > 0 ? (
            <div className="space-y-3">
              {data.topReplies.map((reply) => (
                <ReplyItemCard key={reply.id} reply={reply} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("emptyReplies")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
