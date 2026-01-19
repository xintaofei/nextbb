"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState, useMemo, useCallback } from "react"
import { SearchIcon } from "lucide-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { useParams } from "next/navigation"
import { TopicList, TopicListItem } from "@/components/topic/topic-list"
import { NewTopicDialog } from "@/components/new-topic/new-topic-dialog"
import { TopicHeaderBar } from "@/components/topic/topic-header-bar"
import {
  parseRouteSegments,
  routeParamsToApiQuery,
  type RouteParams,
} from "@/lib/route-utils"
import { notFound } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import useSWR from "swr"

type TopicListResult = {
  items: TopicListItem[]
  page: number
  pageSize: number
  total: number
}

type CategoryDTO = {
  id: string
  name: string
  icon: string
  description: string | null
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch category")
  return res.json()
}

export default function DynamicRoutePage() {
  const t = useTranslations("Index")
  const tc = useTranslations("Common")
  const tCat = useTranslations("Category")
  const params = useParams<{ segments?: string[] }>()
  const [isNewTopicDialogOpen, setIsNewTopicDialogOpen] = useState(false)

  // 解析路由参数
  const routeParams = useMemo(() => {
    const parsed = parseRouteSegments(params.segments)
    if (!parsed.valid) {
      // 无效路由，返回 404
      notFound()
    }
    return parsed as RouteParams
  }, [params.segments])

  const { data: category, isLoading: categoryLoading } = useSWR<CategoryDTO>(
    routeParams.categoryId ? `/api/category/${routeParams.categoryId}` : null,
    fetcher
  )

  const [loading, setLoading] = useState<boolean>(true)
  const [topics, setTopics] = useState<TopicListItem[]>([])
  const [page, setPage] = useState<number>(1)
  const [pageSize] = useState<number>(20)
  const [total, setTotal] = useState<number>(0)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const hasMore = useMemo(() => topics.length < total, [topics.length, total])

  const loadTopics = useCallback(
    async (initial?: boolean, overridePage?: number) => {
      try {
        if (initial) {
          setLoading(true)
        } else {
          setLoadingMore(true)
        }

        // 将路由参数转换为 API 查询参数
        const apiQuery = routeParamsToApiQuery(routeParams)
        const qs = new URLSearchParams()

        if (apiQuery.categoryId) qs.set("categoryId", apiQuery.categoryId)
        if (apiQuery.tagId) qs.set("tagId", apiQuery.tagId)
        if (apiQuery.sort) qs.set("sort", apiQuery.sort)

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
          setLoading(false)
        } else {
          setLoadingMore(false)
        }
      }
    },
    [routeParams, page, pageSize]
  )

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setPage(1)
      setTotal(0)
      setTopics([])
      await loadTopics(true)
    })()
    return () => {}
  }, [routeParams, loadTopics])

  return (
    <div className="flex min-h-screen w-full flex-col px-8 max-sm:p-4 gap-4 max-sm:gap-2">
      <div className="flex flex-row justify-between items-start py-8">
        {routeParams.categoryId ? (
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              {categoryLoading ? (
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
                    {category?.name ??
                      tCat("defaultName", { id: routeParams.categoryId })}
                  </h1>
                </>
              )}
            </div>
            {categoryLoading ? (
              <Skeleton className="h-4 w-96 mt-2" />
            ) : (
              category?.description && (
                <span className="text-muted-foreground mt-2">
                  {category.description}
                </span>
              )
            )}
          </div>
        ) : (
          <h1 className="text-5xl">{t("title")}</h1>
        )}
        <InputGroup className="w-80 hidden md:flex">
          <InputGroupInput placeholder={tc("Search.placeholder")} />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
      </div>
      <TopicHeaderBar
        onSortStart={() => {
          setLoading(true)
          setPage(1)
          setTotal(0)
          setTopics([])
        }}
        onNewTopicClick={() => setIsNewTopicDialogOpen(true)}
      />
      <TopicList
        items={topics}
        loading={loading}
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
