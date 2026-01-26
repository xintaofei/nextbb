"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { RelativeTime } from "@/components/common/relative-time"
import { Spinner } from "@/components/ui/spinner"
import { useEffect, useRef, useState } from "react"
import { CategoryBadge } from "@/components/common/category-badge"
import { TagBadge } from "@/components/common/tag-badge"
import { TopicStatusTags } from "@/components/common/topic-status-tags"
import { UserInfoCard } from "@/components/common/user-info-card"
import { type TopicTypeValue } from "@/types/topic-type"
import { stripHtmlAndTruncate } from "@/lib/utils"

export type TopicAuthor = {
  id: string
  name: string
  avatar: string
}

export type TopicCategory = {
  id: string
  name: string
  icon?: string
  description?: string | null
  bgColor?: string | null
  textColor?: string | null
}

export type TopicTag = {
  id: string
  name: string
  icon: string
  description?: string | null
  bgColor?: string | null
  textColor?: string | null
}

export type TopicListItem = {
  id: string
  title: string
  type: string
  category: TopicCategory
  tags: TopicTag[]
  author: TopicAuthor
  replies: number
  views: number
  activity: string
  isPinned: boolean
  isCommunity: boolean
  firstPost?: {
    id: string
    content: string
    createdAt: string
  }
}

export function TopicList({
  items,
  loading,
  className,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  items: TopicListItem[]
  loading: boolean
  className?: string
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => Promise<void> | void
}) {
  const tc = useTranslations("Common")
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null)
  const [clickedTopicId, setClickedTopicId] = useState<string | null>(null)
  const previousItemsLengthRef = useRef<number>(0)

  useEffect(() => {
    // 恢复之前的点击状态
    const lastClickedId = sessionStorage.getItem("last_clicked_topic_id")
    if (lastClickedId) {
      // 使用 requestAnimationFrame 来避免同步 setState
      requestAnimationFrame(() => setClickedTopicId(lastClickedId))
    }
  }, [])

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // 如果点击的是带有 data-topic-link 属性的元素（即话题链接），则不清除选中状态
      // 这样可以避免与 Link 的 onMouseDown 冲突
      if ((e.target as Element).closest("[data-topic-link]")) {
        return
      }
      setClickedTopicId(null)
      sessionStorage.removeItem("last_clicked_topic_id")
    }
    document.addEventListener("mousedown", handleGlobalClick)
    return () => {
      document.removeEventListener("mousedown", handleGlobalClick)
    }
  }, [])

  useEffect(() => {
    const prevLength = previousItemsLengthRef.current
    if (items.length > prevLength && prevLength > 0) {
      setHighlightIndex(prevLength)
      previousItemsLengthRef.current = items.length
    }
    previousItemsLengthRef.current = items.length
  }, [items.length])

  useEffect(() => {
    if (!sentinelRef.current) return
    if (!hasMore || loadingMore) return
    const el = sentinelRef.current
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          onLoadMore?.()
        }
      },
      { root: null, rootMargin: "0px", threshold: 0.1 }
    )
    observer.observe(el)
    return () => {
      observer.unobserve(el)
      observer.disconnect()
    }
  }, [hasMore, loadingMore, onLoadMore])

  return (
    <Table className={className ?? "w-full table-fixed max-lg:table-auto"}>
      <colgroup>
        <col />
        <col className="w-16 max-sm:hidden" />
        <col className="w-16 max-lg:hidden" />
        <col className="w-16 max-sm:hidden" />
        <col className="w-16 hidden max-sm:table-cell" />
      </colgroup>
      <TableHeader className="max-sm:hidden py-4 h-14">
        <TableRow>
          <TableHead>{tc("Table.topic")}</TableHead>
          <TableHead className="text-center max-sm:hidden">
            {tc("Table.replies")}
          </TableHead>
          <TableHead className="text-center max-lg:hidden">
            {tc("Table.views")}
          </TableHead>
          <TableHead className="text-center max-sm:hidden">
            {tc("Table.activity")}
          </TableHead>
          <TableHead className="text-right hidden max-sm:table-cell">
            {tc("Table.activity")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="[&_tr:first-child]:border-t-3">
        {loading
          ? Array.from({ length: 15 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                <TableCell className="flex flex-col gap-2 max-sm:px-0">
                  <Skeleton className="h-7 w-72 xl:w-80 max-sm:w-64" />
                  <div className="flex max-w-full flex-wrap gap-2 overflow-hidden">
                    <Skeleton className="size-5 rounded-full" />
                    <Skeleton className="h-5 w-20 max-sm:w-16" />
                    <Skeleton className="h-5 w-16 max-sm:w-10" />
                    <Skeleton className="h-5 w-16 max-sm:w-10" />
                  </div>
                </TableCell>
                <TableCell className="text-center max-sm:hidden">
                  <Skeleton className="h-4 w-10 mx-auto" />
                </TableCell>
                <TableCell className="text-center max-lg:hidden">
                  <Skeleton className="h-4 w-10 mx-auto" />
                </TableCell>
                <TableCell className="text-center max-sm:px-0">
                  <Skeleton className="h-4 w-10 mx-auto" />
                </TableCell>
              </TableRow>
            ))
          : items.map((t, index) => (
              <TableRow
                key={t.id}
                className={
                  highlightIndex === index || clickedTopicId === t.id
                    ? "animate-(--animate-highlight-fade)"
                    : ""
                }
                onAnimationEnd={() => {
                  if (highlightIndex === index) {
                    setHighlightIndex(null)
                  }
                }}
              >
                <TableCell className="max-w-full max-sm:px-0 relative">
                  {clickedTopicId === t.id && (
                    <div className="absolute left-0 max-sm:-left-[3px] top-0 bottom-0 w-[3px] bg-primary rounded-r-sm" />
                  )}
                  <div>
                    <TopicStatusTags
                      isPinned={t.isPinned}
                      isCommunity={t.isCommunity}
                      topicType={t.type as TopicTypeValue}
                      className="align-middle mr-1"
                    />
                    <Link
                      href={`/topic/${t.id}`}
                      className="align-middle"
                      data-topic-link
                      onMouseDown={() => {
                        setClickedTopicId(t.id)
                        sessionStorage.setItem("last_clicked_topic_id", t.id)
                      }}
                    >
                      <span className="max-w-full text-lg font-medium whitespace-normal wrap-break-word">
                        {t.title}
                      </span>
                    </Link>
                  </div>
                  <div className="flex max-w-full flex-wrap items-center gap-2 overflow-hidden mt-2">
                    <UserInfoCard
                      userId={t.author.id}
                      userName={t.author.name}
                      userAvatar={t.author.avatar}
                      side="right"
                    >
                      <Avatar className="size-5 cursor-pointer">
                        <AvatarImage
                          src={t.author.avatar}
                          alt={t.author.name}
                        />
                        <AvatarFallback>
                          {t.author.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </UserInfoCard>
                    <CategoryBadge
                      id={t.category.id}
                      icon={t.category.icon}
                      name={t.category.name}
                      description={t.category.description}
                      bgColor={t.category.bgColor}
                      textColor={t.category.textColor}
                    />
                    {t.tags.map((tag) => (
                      <TagBadge
                        key={tag.id}
                        id={tag.id}
                        icon={tag.icon}
                        name={tag.name}
                        description={tag.description}
                        bgColor={tag.bgColor}
                        textColor={tag.textColor}
                      />
                    ))}
                  </div>
                  {t.firstPost && (
                    <Link
                      href={`/topic/${t.id}`}
                      className="inline-flex mt-2 text-base text-muted-foreground max-w-full"
                    >
                      <span className="line-clamp-3 whitespace-normal wrap-break-word">
                        {stripHtmlAndTruncate(t.firstPost.content)}
                      </span>
                    </Link>
                  )}
                </TableCell>
                <TableCell className="text-center text-muted-foreground max-sm:hidden">
                  {t.replies}
                </TableCell>
                <TableCell className="text-center text-muted-foreground max-lg:hidden">
                  {t.views}
                </TableCell>
                <TableCell className="text-center text-muted-foreground max-sm:hidden">
                  <RelativeTime date={t.activity} />
                </TableCell>
                <TableCell className="text-center text-muted-foreground hidden max-sm:table-cell relative">
                  <span className="absolute top-2 right-0 text-primary">
                    {t.replies}
                  </span>
                  <span className="absolute bottom-2 right-0">
                    <RelativeTime date={t.activity} />
                  </span>
                </TableCell>
              </TableRow>
            ))}
        {!loading && items.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={4}
              className="text-center text-muted-foreground"
            >
              {tc("Table.empty")}
            </TableCell>
          </TableRow>
        )}
        {!loading && (
          <TableRow>
            <TableCell colSpan={4}>
              <div className="flex w-full items-center justify-center py-4">
                {loadingMore ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Spinner className="size-4" />
                    <span>{tc("Loading.loading")}</span>
                  </div>
                ) : hasMore ? (
                  <div ref={sentinelRef} className="h-6 w-full" />
                ) : (
                  <span className="text-muted-foreground">
                    {tc("Loading.noMore")}
                  </span>
                )}
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
