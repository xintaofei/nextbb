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
import { TopicControls } from "@/components/topic/topic-controls"
import { Skeleton } from "@/components/ui/skeleton"
import { TopicList, TopicListItem } from "@/components/topic/topic-list"
import { NewTopicButton } from "@/components/new-topic/new-topic-button"
import { NewTopicDialog } from "@/components/new-topic/new-topic-dialog"
import { TopicSortTabs } from "@/components/topic/topic-sort-tabs"

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
  async function loadTopics() {
    try {
      setTopicsLoading(true)
      const categoryId = searchParams.get("categoryId") ?? id
      const tagId = searchParams.get("tagId")
      const sort = searchParams.get("sort")
      const qs = new URLSearchParams()
      if (categoryId) qs.set("categoryId", categoryId)
      if (tagId) qs.set("tagId", tagId)
      if (sort) qs.set("sort", sort)
      qs.set("page", "1")
      qs.set("pageSize", "20")
      const res = await fetch(`/api/topics?${qs.toString()}`, {
        cache: "no-store",
      })
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
        const categoryId = searchParams.get("categoryId") ?? id
        const tagId = searchParams.get("tagId")
        const qs = new URLSearchParams()
        if (categoryId) qs.set("categoryId", categoryId)
        if (tagId) qs.set("tagId", tagId)
        qs.set("page", "1")
        qs.set("pageSize", "20")
        const res = await fetch(`/api/topics?${qs.toString()}`, {
          cache: "no-store",
        })
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
  }, [id, searchParams])

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
          <TopicControls
            className="flex flex-row gap-2"
            initialCategoryId={id}
          />
          <TopicSortTabs />
        </div>
        <div className="flex flex-row gap-2">
          <NewTopicButton onClick={() => setIsNewTopicDialogOpen(true)} />
        </div>
      </div>
      <TopicList items={topics} loading={loading || topicsLoading} />
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
