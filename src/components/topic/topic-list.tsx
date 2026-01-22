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

export type TopicParticipant = {
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
  participants: TopicParticipant[]
  replies: number
  views: number
  activity: string
  isPinned: boolean
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
  const previousItemsLengthRef = useRef<number>(0)

  useEffect(() => {
    const prevLength = previousItemsLengthRef.current
    if (items.length > prevLength && prevLength > 0) {
      setHighlightIndex(prevLength)
      const timer = setTimeout(() => {
        setHighlightIndex(null)
      }, 2000)
      previousItemsLengthRef.current = items.length
      return () => clearTimeout(timer)
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
        <col className="w-32 max-lg:w-16" />
        <col className="w-20 max-lg:w-16 max-sm:hidden" />
        <col className="w-20 max-lg:hidden" />
        <col className="w-20 max-lg:w-16 max-sm:hidden" />
        <col className="w-16 hidden max-sm:table-cell" />
      </colgroup>
      <TableHeader className="max-sm:hidden py-4 h-14">
        <TableRow>
          <TableHead>{tc("Table.topic")}</TableHead>
          <TableHead className="max-sm:hidden"></TableHead>
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
      <TableBody className="sm:[&_tr:first-child]:border-t-3">
        {loading
          ? Array.from({ length: 15 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                <TableCell className="flex flex-col gap-2 max-sm:px-0">
                  <Skeleton className="h-7 w-72 xl:w-96 max-sm:w-64" />
                  <div className="flex max-w-full flex-wrap gap-2 overflow-hidden">
                    <Skeleton className="size-5 rounded-full hidden max-sm:block" />
                    <Skeleton className="h-5 w-20 max-sm:w-16" />
                    <Skeleton className="h-5 w-16 max-sm:w-10" />
                    <Skeleton className="h-5 w-16 max-sm:w-10" />
                  </div>
                </TableCell>
                <TableCell className="max-lg:text-center max-sm:hidden">
                  <div className="flex lg:-space-x-2 max-lg:justify-center">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Skeleton
                        key={j}
                        className={`size-7 rounded-full ring-2 ring-background ${
                          j > 0 ? "max-lg:hidden" : ""
                        }`}
                      />
                    ))}
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
                  highlightIndex === index
                    ? "animate-(--animate-highlight-fade)"
                    : ""
                }
              >
                <TableCell className="max-w-full max-sm:px-0">
                  <div>
                    <TopicStatusTags
                      isPinned={t.isPinned}
                      topicType={t.type as TopicTypeValue}
                      className="align-middle mr-1"
                    />
                    <Link href={`/topic/${t.id}`} className="align-middle">
                      <span className="max-w-full text-lg font-medium whitespace-normal wrap-break-word">
                        {t.title}
                      </span>
                    </Link>
                  </div>
                  <div className="flex max-w-full flex-wrap items-center gap-2 overflow-hidden mt-2">
                    <UserInfoCard
                      userId={t.participants[0].id}
                      userName={t.participants[0].name}
                      userAvatar={t.participants[0].avatar}
                      side="right"
                    >
                      <Avatar className="hidden max-sm:flex size-5 cursor-pointer">
                        <AvatarImage
                          src={t.participants[0].avatar}
                          alt={t.participants[0].name}
                        />
                        <AvatarFallback>
                          {t.participants[0].name.slice(0, 2).toUpperCase()}
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
                    <div className="mt-2 text-base text-muted-foreground max-w-full">
                      <Link href={`/topic/${t.id}`}>
                        <span className="line-clamp-3 whitespace-normal wrap-break-word">
                          {stripHtmlAndTruncate(t.firstPost.content)}
                        </span>
                      </Link>
                    </div>
                  )}
                </TableCell>
                <TableCell className="max-sm:hidden">
                  <div className="*:data-[slot=avatar]:ring-background flex lg:-space-x-2 *:data-[slot=avatar]:ring-2 max-lg:justify-center">
                    {dedupeAndLimit(t.participants, 5).map((u, idx) => (
                      <UserInfoCard
                        key={u.id}
                        userId={u.id}
                        userName={u.name}
                        userAvatar={u.avatar}
                        side="top"
                        align="center"
                      >
                        <Avatar
                          className={`size-7 relative cursor-pointer ${idx === 0 ? "z-5" : idx === 1 ? "z-4" : idx === 2 ? "z-3" : idx === 3 ? "z-2" : "z-1"} ${idx > 0 ? "max-lg:hidden" : ""}`}
                        >
                          <AvatarImage src={u.avatar} alt={u.name} />
                          <AvatarFallback>
                            {u.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </UserInfoCard>
                    ))}
                  </div>
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
              colSpan={5}
              className="text-center text-muted-foreground"
            >
              {tc("Table.empty")}
            </TableCell>
          </TableRow>
        )}
        {!loading && (
          <TableRow>
            <TableCell colSpan={5}>
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

function dedupeAndLimit<T extends { id: string }>(
  arr: T[],
  limit: number
): T[] {
  const seen = new Set<string>()
  const result: T[] = []
  for (const item of arr) {
    if (!seen.has(item.id)) {
      seen.add(item.id)
      result.push(item)
      if (result.length >= limit) break
    }
  }
  return result
}
