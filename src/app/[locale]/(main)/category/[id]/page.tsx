"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { SearchIcon } from "lucide-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Skeleton } from "@/components/ui/skeleton"
import { TopicList, TopicListItem } from "@/components/topic/topic-list"
import { NewTopicDialog } from "@/components/new-topic/new-topic-dialog"
import { TopicHeaderBar } from "@/components/topic/topic-header-bar"
import { useMemo } from "react"

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>()
  const tc = useTranslations("Common")
  const tCat = useTranslations("Category")
  const searchParams = useSearchParams()
  const [isNewTopicDialogOpen, setIsNewTopicDialogOpen] = useState(false)

  type TopicListResult = {
    items: TopicListItem[]
    page: number
    pageSize: number
    total: number
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
  const [page, setPage] = useState<number>(1)
  const [pageSize] = useState<number>(15)
  const [total, setTotal] = useState<number>(0)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const hasMore = useMemo(() => topics.length < total, [topics.length, total])
  async function loadTopics(initial?: boolean, overridePage?: number) {
    try {
      if (initial) {
        setTopicsLoading(true)
      } else {
        setLoadingMore(true)
      }
      const categoryId = searchParams.get("categoryId") ?? id
      const tagId = searchParams.get("tagId")
      const sort = searchParams.get("sort")
      const qs = new URLSearchParams()
      if (categoryId) qs.set("categoryId", categoryId)
      if (tagId) qs.set("tagId", tagId)
      if (sort) qs.set("sort", sort)
      qs.set("page", String(overridePage ?? (initial ? 1 : page)))
      qs.set("pageSize", String(pageSize))
      const res = await fetch(`/api/topics?${qs.toString()}`, {
        cache: "no-store",
      })
      if (!res.ok) return
      const data: TopicListResult = await res.json()
      if (initial) {
        const unique = (() => {
          const seen = new Set<string>()
          const res: TopicListItem[] = []
          for (const it of data.items) {
            if (!seen.has(it.id)) {
              seen.add(it.id)
              res.push(it)
            }
          }
          return res
        })()
        setTopics(unique)
        setTotal(data.total)
        setPage(1)
      } else {
        setTopics((prev) => {
          const seen = new Set(prev.map((p) => p.id))
          const next = data.items.filter((it) => !seen.has(it.id))
          return [...prev, ...next]
        })
        setTotal(data.total)
      }
    } catch {
    } finally {
      if (initial) {
        setTopicsLoading(false)
      } else {
        setLoadingMore(false)
      }
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
        setPage(1)
        setTotal(0)
        setTopics([])
        const categoryId = searchParams.get("categoryId") ?? id
        const tagId = searchParams.get("tagId")
        const sort = searchParams.get("sort")
        const qs = new URLSearchParams()
        if (categoryId) qs.set("categoryId", categoryId)
        if (tagId) qs.set("tagId", tagId)
        if (sort) qs.set("sort", sort)
        qs.set("page", "1")
        qs.set("pageSize", String(pageSize))
        const res = await fetch(`/api/topics?${qs.toString()}`, {
          cache: "no-store",
        })
        if (!res.ok) return
        const data: TopicListResult = await res.json()
        if (!cancelled) {
          setTopics(data.items)
          setTotal(data.total)
          setPage(1)
        }
      } catch {
      } finally {
        if (!cancelled) setTopicsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, pageSize, searchParams])

  return (
    <div className="flex min-h-screen w-full flex-col px-8 max-sm:p-4 gap-4 max-sm:gap-2">
      <div className="flex flex-row justify-between items-start py-8">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            {loading ? (
              <>
                <Skeleton className="h-14 w-14 rounded-full" />
                <Skeleton className="h-14 w-64" />
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
        <InputGroup className="w-80 hidden md:flex">
          <InputGroupInput placeholder={tc("Search.placeholder")} />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
      </div>
      <TopicHeaderBar
        categoryId={id}
        onSortStart={() => {
          setTopicsLoading(true)
          setPage(1)
          setTotal(0)
          setTopics([])
        }}
        onNewTopicClick={() => setIsNewTopicDialogOpen(true)}
      />
      <TopicList
        items={topics}
        loading={loading || topicsLoading}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={async () => {
          if (loadingMore || !hasMore) return
          const next = page + 1
          setPage(next)
          await loadTopics(false, next)
        }}
      />
      <NewTopicDialog
        open={isNewTopicDialogOpen}
        onOpenChange={setIsNewTopicDialogOpen}
        onPublished={() => {
          loadTopics(true)
        }}
      />
    </div>
  )
}
