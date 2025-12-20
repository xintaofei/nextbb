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

function formatRelative(iso: string): string {
  if (!iso) return ""
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return `${diff}秒`
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时`
  return `${Math.floor(diff / 86400)}天`
}

export function TopicList({
  items,
  loading,
  className,
}: {
  items: TopicListItem[]
  loading: boolean
  className?: string
}) {
  const tc = useTranslations("Common")

  return (
    <Table className={className ?? "w-full table-fixed"}>
      <colgroup>
        <col />
        <col className="w-40" />
        <col className="w-20" />
        <col className="w-20" />
        <col className="w-20" />
      </colgroup>
      <TableHeader>
        <TableRow>
          <TableHead colSpan={2}>{tc("Table.topic")}</TableHead>
          <TableHead className="text-center">{tc("Table.replies")}</TableHead>
          <TableHead className="text-center">{tc("Table.views")}</TableHead>
          <TableHead className="text-center">{tc("Table.activity")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                <TableCell className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-80" />
                  <div className="flex max-w-full flex-wrap gap-2 overflow-hidden">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <Skeleton
                        key={j}
                        className="h-8 w-8 rounded-full ring-2 ring-background"
                      />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-4 w-12 mx-auto" />
                </TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-4 w-12 mx-auto" />
                </TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-4 w-20 mx-auto" />
                </TableCell>
              </TableRow>
            ))
          : items.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="flex flex-col gap-2">
                  <Link href={`/topic/${t.id}`}>
                    <span className="cursor-pointer max-w-full text-lg font-medium whitespace-normal break-words">
                      {t.title}
                    </span>
                  </Link>
                  <div className="flex max-w-full flex-wrap gap-2 overflow-hidden">
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
                  <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2">
                    {t.participants.map((u) => (
                      <Avatar key={u.id}>
                        <AvatarImage src={u.avatar} alt={u.name} />
                        <AvatarFallback>
                          {u.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center">{t.replies}</TableCell>
                <TableCell className="text-center">{t.views}</TableCell>
                <TableCell className="text-center">
                  {formatRelative(t.activity)}
                </TableCell>
              </TableRow>
            ))}
      </TableBody>
    </Table>
  )
}

