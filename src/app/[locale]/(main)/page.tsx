"use client"

import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BadgeCheckIcon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { NewTopicButton } from "@/components/new-topic/new-topic-button"
import { NewTopicDialog } from "@/components/new-topic/new-topic-dialog"
import Link from "next/link"
import { CategorySelect } from "@/components/filters/category-select"
import { TagSelect } from "@/components/filters/tag-select"
import { Skeleton } from "@/components/ui/skeleton"

type TopicParticipant = {
  id: string
  name: string
  avatar: string
}

type TopicListItem = {
  id: string
  title: string
  category: { id: string; name: string; icon?: string }
  tags: { id: string; name: string; icon: string }[]
  participants: TopicParticipant[]
  replies: number
  views: number
  activity: string
}

type TopicListResult = {
  items: TopicListItem[]
  page: number
  pageSize: number
  total: number
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

export default function Home() {
  const t = useTranslations("Index")
  const tc = useTranslations("Common")
  const [isNewTopicDialogOpen, setIsNewTopicDialogOpen] = useState(false)

  const [loading, setLoading] = useState<boolean>(true)
  const [topics, setTopics] = useState<TopicListItem[]>([])
  async function loadTopics() {
    try {
      setLoading(true)
      const res = await fetch(`/api/topics?page=1&pageSize=20`, {
        cache: "no-store",
      })
      if (!res.ok) return
      const data: TopicListResult = await res.json()
      setTopics(data.items)
    } catch {
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await loadTopics()
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex min-h-screen w-full flex-col px-8 gap-4">
      <div className="flex flex-row justify-between items-center py-8">
        <h1 className="text-5xl">{t("title")}</h1>
        <InputGroup className="w-80">
          <InputGroupInput placeholder={tc("Search.placeholder")} />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row gap-4">
          <div className="flex flex-row gap-2">
            <CategorySelect className="w-30" />
            <TagSelect className="w-30" />
          </div>
          <Tabs defaultValue="1">
            <TabsList>
              <TabsTrigger value="1">{tc("Tabs.latest")}</TabsTrigger>
              <TabsTrigger value="2">{tc("Tabs.hot")}</TabsTrigger>
              <TabsTrigger value="3">{tc("Tabs.leaderboard")}</TabsTrigger>
              <TabsTrigger value="4">{tc("Tabs.categories")}</TabsTrigger>
              <TabsTrigger value="5">{tc("Tabs.myPosts")}</TabsTrigger>
              <TabsTrigger value="6">{tc("Tabs.favorites")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex flex-row gap-2">
          <NewTopicButton onClick={() => setIsNewTopicDialogOpen(true)} />
        </div>
      </div>
      <Table className="w-full table-fixed">
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
            <TableHead className="text-center">
              {tc("Table.activity")}
            </TableHead>
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
            : topics.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell className="flex flex-col gap-2">
                    <Link href={`/topic/${topic.id}`}>
                      <span className="cursor-pointer max-w-full text-lg font-medium whitespace-normal break-words">
                        {topic.title}
                      </span>
                    </Link>
                    <div className="flex max-w-full flex-wrap gap-2 overflow-hidden">
                      <Badge variant="secondary">
                        {topic.category.icon ?? "📁"} {topic.category.name}
                      </Badge>
                      {topic.tags.map((tag) => (
                        <Badge key={tag.id} variant="outline">
                          {tag.icon} {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
                      {topic.participants.map((u) => (
                        <Avatar key={u.id}>
                          <AvatarImage src={u.avatar} alt={u.name} />
                          <AvatarFallback>
                            {u.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{topic.replies}</TableCell>
                  <TableCell className="text-center">{topic.views}</TableCell>
                  <TableCell className="text-center">
                    {formatRelative(topic.activity)}
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>

      <NewTopicDialog
        open={isNewTopicDialogOpen}
        onOpenChange={setIsNewTopicDialogOpen}
        onPublished={() => {
          loadTopics()
        }}
      />
    </div>
  )
}
