"use client"

import { useTranslations } from "next-intl"
import { useMemo, useEffect } from "react"
import useSWRInfinite from "swr/infinite"
import { TopicList, TopicListItem } from "@/components/topic/topic-list"
import { useNewTopic } from "@/components/providers/new-topic-provider"
import { TopicHeaderBar } from "@/components/topic/topic-header-bar"
import { routeParamsToApiQuery, type RouteParams } from "@/lib/route-utils"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useCategories } from "@/components/providers/taxonomy-provider"
import type { CategoryWithCount } from "@/types/taxonomy"

type TopicListResult = {
  items: TopicListItem[]
  page: number
  pageSize: number
  total: number
}

type DynamicRouteClientProps = {
  routeParams: RouteParams
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch data")
  return res.json()
}

export function DynamicRouteClient({ routeParams }: DynamicRouteClientProps) {
  const tCat = useTranslations("Category")
  const { registerOnPublished } = useNewTopic()
  const categories = useCategories()

  // 从分类列表中查找当前分类
  const category = useMemo(() => {
    if (!routeParams.categoryId) return null
    return categories.find((cat) => cat.id === routeParams.categoryId) ?? null
  }, [categories, routeParams.categoryId])

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
    revalidateFirstPage: true,
    revalidateOnFocus: true,
  })

  useEffect(() => {
    return registerOnPublished(() => {
      mutate()
    })
  }, [registerOnPublished, mutate])

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
          <CategoryHeader
            category={category}
            categoryId={routeParams.categoryId}
            tCat={tCat}
          />
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
    </div>
  )
}

function CategoryHeader({
  category,
  categoryId,
  tCat,
}: {
  category: CategoryWithCount | null
  categoryId: string
  tCat: ReturnType<typeof useTranslations<"Category">>
}) {
  return (
    <div className="flex flex-col p-8 max-sm:p-4 bg-muted/40 border-b max-sm:border max-sm:rounded-md">
      <div className="flex justify-center items-center gap-3">
        {!category ? (
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
                {category.icon ?? "📁"}
              </span>
              <h1 className="text-5xl">
                {category.name ?? tCat("defaultName", { id: categoryId })}
              </h1>
            </div>
            {category.description && (
              <span className="text-muted-foreground mt-2">
                {category.description}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
