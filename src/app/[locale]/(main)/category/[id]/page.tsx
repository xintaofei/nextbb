"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { BadgeCheckIcon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NewTopicButton } from "@/components/new-topic/new-topic-button"
import { NewTopicDialog } from "@/components/new-topic/new-topic-dialog"
import { useTranslations } from "next-intl"
import { CategorySelect } from "@/components/filters/category-select"
import { TagSelect } from "@/components/filters/tag-select"
import { Skeleton } from "@/components/ui/skeleton"

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>()
  const [isNewTopicDialogOpen, setIsNewTopicDialogOpen] = useState(false)
  const tc = useTranslations("Common")
  const tCat = useTranslations("Category")

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

  type CategoryInfo = {
    id: string
    name: string
    icon?: string
    description: string | null
  }

  const [category, setCategory] = useState<CategoryInfo | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [topics, setTopics] = useState<TopicListItem[]>([])
  const [topicsLoading, setTopicsLoading] = useState<boolean>(true)
  async function loadTopics() {
    try {
      setTopicsLoading(true)
      const res = await fetch(
        `/api/topics?categoryId=${encodeURIComponent(id)}&page=1&pageSize=20`,
        { cache: "no-store" }
      )
      if (!res.ok) return
      const data: TopicListResult = await res.json()
      setTopics(data.items)
    } catch {
    } finally {
      setTopicsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/category/${id}`, { cache: "no-store" })
        if (!res.ok) {
          const fallback: CategoryInfo = {
            id,
            name: tCat("defaultName", { id }),
            icon: "📁",
            description: null,
          }
          if (!cancelled) setCategory(fallback)
          return
        }
        const data: CategoryInfo = await res.json()
        if (!cancelled) setCategory(data)
      } catch {
        const fallback: CategoryInfo = {
          id,
          name: tCat("defaultName", { id }),
          icon: "📁",
          description: null,
        }
        if (!cancelled) setCategory(fallback)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id, tCat])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setTopicsLoading(true)
        const res = await fetch(
          `/api/topics?categoryId=${encodeURIComponent(id)}&page=1&pageSize=20`,
          { cache: "no-store" }
        )
        if (!res.ok) return
        const data: TopicListResult = await res.json()
        if (!cancelled) setTopics(data.items)
      } catch {
      } finally {
        if (!cancelled) setTopicsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <div className="flex min-h-screen w-full flex-col px-8 gap-4">
      <div className="flex flex-row justify-between items-start py-8">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            {loading ? (
              <>
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-10 w-64" />
              </>
            ) : (
              <>
                <span className="text-5xl leading-none">
                  {category?.icon ?? "📁"}
                </span>
                <h1 className="text-5xl">
                  {category?.name ?? tCat("defaultName", { id })}
                </h1>
              </>
            )}
          </div>
          {loading ? (
            <Skeleton className="h-4 w-96 mt-2" />
          ) : (
            <span className="text-muted-foreground mt-2">
              {category?.description ?? tCat("noDescription")}
            </span>
          )}
        </div>
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
          {loading || topicsLoading
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
            : topics.map((t) => (
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
                    <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
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
