"use client"

import { useTranslations } from "next-intl"
import { useState, useMemo } from "react"
import useSWR from "swr"
import useSWRInfinite from "swr/infinite"
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
import { cn } from "@/lib/utils"

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
  if (!res.ok) throw new Error("Failed to fetch data")
  return res.json()
}

export default function DynamicRoutePage() {
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

  const getKey = (pageIndex: number, previousPageData: TopicListResult) => {
    if (previousPageData && !previousPageData.items.length) return null
    const apiQuery = routeParamsToApiQuery(routeParams)
    const qs = new URLSearchParams()
    if (apiQuery.categoryId) qs.set("categoryId", apiQuery.categoryId)
    if (apiQuery.tagId) qs.set("tagId", apiQuery.tagId)
    if (apiQuery.sort) qs.set("sort", apiQuery.sort)
    if (apiQuery.filter) qs.set("filter", apiQuery.filter)
    qs.set("page", String(pageIndex + 1))
    qs.set("pageSize", "20")
    return `/api/topics?${qs.toString()}`
  }

  const {
    data: topicPages,
    size,
    setSize,
    isLoading: isTopicLoading,
    mutate,
  } = useSWRInfinite<TopicListResult>(getKey, fetcher, {
    revalidateFirstPage: true, // 始终重新验证第一页以获取最新数据
    revalidateOnFocus: true, // 窗口聚焦时自动刷新
  })

  const topics = useMemo(() => {
    return topicPages ? topicPages.flatMap((page) => page.items) : []
  }, [topicPages])

  const total = topicPages?.[0]?.total ?? 0
  const isLoadingMore =
    isTopicLoading ||
    (size > 0 && topicPages && typeof topicPages[size - 1] === "undefined")
  const hasMore = topics.length < total

  return (
    <div className="flex min-h-screen w-full flex-col max-sm:p-4">
      <TopicHeaderBar
        className="p-4 max-sm:p-0 max-sm:pb-4 sm:sticky sm:top-0 sm:z-1 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
        onSortStart={() => {}}
      />
      <div className={cn(routeParams.categoryId ? "max-sm:mb-4" : "")}>
        {routeParams.categoryId && (
          <div className="flex flex-col p-8 max-sm:p-4 bg-muted/40 border-b max-sm:border max-sm:rounded-md">
            <div className="flex justify-center items-center gap-3">
              {categoryLoading ? (
                <div className="flex flex-col justify-center gap-4">
                  <div className="flex justify-center items-center gap-2">
                    <Skeleton className="h-12 w-14 rounded-full" />
                    <Skeleton className="h-12 w-64" />
                  </div>
                  <Skeleton className="h-6 w-96" />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-center items-center gap-2">
                    <span className="text-5xl leading-none">
                      {category?.icon ?? "📁"}
                    </span>
                    <h1 className="text-5xl">
                      {category?.name ??
                        tCat("defaultName", { id: routeParams.categoryId })}
                    </h1>
                  </div>
                  {category?.description && (
                    <span className="text-muted-foreground mt-2">
                      {category.description}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <TopicList
        items={topics}
        loading={!topicPages && isTopicLoading}
        hasMore={hasMore}
        loadingMore={isLoadingMore}
        onLoadMore={() => {
          setSize(size + 1)
        }}
      />
      <NewTopicDialog
        open={isNewTopicDialogOpen}
        onOpenChange={setIsNewTopicDialogOpen}
        onPublished={() => {
          mutate()
        }}
      />
    </div>
  )
}
