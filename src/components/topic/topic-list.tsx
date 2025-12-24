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
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { formatRelative } from "@/lib/time"
import { Spinner } from "@/components/ui/spinner"
import { useEffect, useRef } from "react"

export type TopicParticipant = {
  id: string
  name: string
  avatar: string
}

export type TopicCategory = {
  id: string
  name: string
  icon?: string
}

export type TopicTag = {
  id: string
  name: string
  icon: string
}

export type TopicListItem = {
  id: string
  title: string
  category: TopicCategory
  tags: TopicTag[]
  participants: TopicParticipant[]
  replies: number
  views: number
  activity: string
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
    <Table
      className={className ?? "w-full table-fixed max-[1300px]:table-auto"}
    >
      <colgroup>
        <col />
        <col className="w-40 max-[1300px]:w-16" />
        <col className="w-20 max-[1300px]:w-16" />
        <col className="w-20 max-[1300px]:hidden" />
        <col className="w-20 max-[1300px]:w-16" />
      </colgroup>
      <TableHeader>
        <TableRow>
          <TableHead colSpan={2}>{tc("Table.topic")}</TableHead>
          <TableHead className="text-center">{tc("Table.replies")}</TableHead>
          <TableHead className="text-center max-[1300px]:hidden">
            {tc("Table.views")}
          </TableHead>
          <TableHead className="text-center">{tc("Table.activity")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading
          ? Array.from({ length: 15 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                <TableCell className="flex flex-col gap-2">
                  <Skeleton className="h-7 w-72" />
                  <div className="flex max-w-full flex-wrap gap-2 overflow-hidden">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </TableCell>
                <TableCell className="max-[1300px]:text-center">
                  <div className="flex -space-x-2 max-[1300px]:justify-center">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Skeleton
                        key={j}
                        className={`h-8 w-8 rounded-full ring-2 ring-background ${
                          j > 0 ? "max-[1300px]:hidden" : ""
                        }`}
                      />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-4 w-10 mx-auto" />
                </TableCell>
                <TableCell className="text-center max-[1300px]:hidden">
                  <Skeleton className="h-4 w-10 mx-auto" />
                </TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-4 w-10 mx-auto" />
                </TableCell>
              </TableRow>
            ))
          : items.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="max-w-full">
                  <Link href={`/topic/${t.id}`}>
                    <span className="max-w-full text-lg font-medium whitespace-normal wrap-break-word">
                      {t.title}
                    </span>
                  </Link>
                  <div className="flex max-w-full flex-wrap gap-2 overflow-hidden mt-2">
                    <Badge variant="secondary">
                      {t.category.icon ?? "📁"} {t.category.name}
                    </Badge>
                    {t.tags.map((tag) => (
                      <Badge key={tag.id} variant="outline">
                        {tag.icon} {tag.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 max-[1300px]:justify-center">
                    {dedupeAndLimit(t.participants, 5).map((u, idx) => (
                      <Avatar
                        key={u.id}
                        className={`relative ${idx === 0 ? "z-50" : idx === 1 ? "z-40" : idx === 2 ? "z-30" : idx === 3 ? "z-20" : "z-10"} ${idx > 0 ? "max-[1300px]:hidden" : ""}`}
                      >
                        <AvatarImage src={u.avatar} alt={u.name} />
                        <AvatarFallback>
                          {u.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {t.replies}
                </TableCell>
                <TableCell className="text-center text-muted-foreground max-[1300px]:hidden">
                  {t.views}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {formatRelative(t.activity)}
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
