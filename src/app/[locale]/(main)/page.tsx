"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { SearchIcon } from "lucide-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { useSearchParams } from "next/navigation"
import { TopicControls } from "@/components/topic/topic-controls"
import { TopicList, TopicListItem } from "@/components/topic/topic-list"
import { NewTopicButton } from "@/components/new-topic/new-topic-button"
import { NewTopicDialog } from "@/components/new-topic/new-topic-dialog"
import { TopicSortTabs } from "@/components/topic/topic-sort-tabs"
import { useMemo } from "react"

type TopicListResult = {
  items: TopicListItem[]
  page: number
  pageSize: number
  total: number
}

export default function Home() {
  const t = useTranslations("Index")
  const tc = useTranslations("Common")
  const searchParams = useSearchParams()
  const [isNewTopicDialogOpen, setIsNewTopicDialogOpen] = useState(false)

  const [loading, setLoading] = useState<boolean>(true)
  const [topics, setTopics] = useState<TopicListItem[]>([])
  const [page, setPage] = useState<number>(1)
  const [pageSize] = useState<number>(10)
  const [total, setTotal] = useState<number>(0)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const hasMore = useMemo(() => topics.length < total, [topics.length, total])
  async function loadTopics(initial?: boolean) {
    try {
      if (initial) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      const categoryId = searchParams.get("categoryId")
      const tagId = searchParams.get("tagId")
      const sort = searchParams.get("sort")
      const qs = new URLSearchParams()
      if (categoryId) qs.set("categoryId", categoryId)
      if (tagId) qs.set("tagId", tagId)
      if (sort) qs.set("sort", sort)
      qs.set("page", String(initial ? 1 : page))
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
        setLoading(false)
      } else {
        setLoadingMore(false)
      }
    }
  }
  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setPage(1)
      setTotal(0)
      setTopics([])
      await loadTopics(true)
    })()
    return () => {}
  }, [searchParams])

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
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
        <div className="flex flex-col gap-3 md:flex-row">
          <TopicControls className="flex flex-row gap-2" />
          <TopicSortTabs
            onSortStart={() => {
              setLoading(true)
              setPage(1)
              setTotal(0)
              setTopics([])
            }}
          />
        </div>
        <div className="flex flex-row gap-2">
          <NewTopicButton onClick={() => setIsNewTopicDialogOpen(true)} />
        </div>
      </div>
      <TopicList
        items={topics}
        loading={loading}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={async () => {
          if (loadingMore || !hasMore) return
          const next = page + 1
          setPage(next)
          await loadTopics(false)
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
