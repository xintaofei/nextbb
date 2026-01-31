"use client"

import { useTranslations } from "next-intl"
import { useMemo, useEffect, useRef, useCallback } from "react"
import useSWRInfinite from "swr/infinite"
import { TopicList } from "@/components/topic/topic-list"
import { useNewTopic } from "@/components/providers/new-topic-provider"
import { TopicHeaderBar } from "@/components/topic/topic-header-bar"
import { type RouteParams } from "@/lib/route-utils"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useCategories } from "@/components/providers/taxonomy-provider"
import type { CategoryWithCount } from "@/types/taxonomy"
import type { TopicListResult } from "@/lib/services/topic-service"
import React from "react"

type DynamicRouteClientProps = {
  routeParams: RouteParams
  initialData?: TopicListResult
}

const PAGE_SIZE = 20

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch data")
  return res.json()
}

export function DynamicRouteClient({
  routeParams,
  initialData,
}: DynamicRouteClientProps) {
  const tCat = useTranslations("Category")
  const { registerOnPublished } = useNewTopic()
  const categories = useCategories()

  // 存储初始数据引用，避免重复请求第一页
  const initialDataRef = useRef(initialData)
  const firstPageFetchedRef = useRef(false)

  // 从分类列表中查找当前分类
  const category = useMemo(() => {
    if (!routeParams.categoryId) return null
    return categories.find((cat) => cat.id === routeParams.categoryId) ?? null
  }, [categories, routeParams.categoryId])

  // 使用 useCallback 稳定 getKey 函数引用，避免 SWR 误判 key 变化
  const getKey = useCallback(
    (pageIndex: number, previousPageData: TopicListResult | null) => {
      if (previousPageData && !previousPageData.items.length) return null
      const qs = new URLSearchParams()
      if (routeParams.categoryId) qs.set("categoryId", routeParams.categoryId)
      if (routeParams.tagId) qs.set("tagId", routeParams.tagId)
      if (routeParams.sort) qs.set("sort", routeParams.sort)
      if (routeParams.filter) qs.set("filter", routeParams.filter)
      qs.set("page", String(pageIndex + 1))
      qs.set("pageSize", String(PAGE_SIZE))
      return `/api/topics?${qs.toString()}`
    },
    [
      routeParams.categoryId,
      routeParams.tagId,
      routeParams.sort,
      routeParams.filter,
    ]
  )

  // 自定义 fetcher：拦截第一页请求，使用预取数据
  const topicFetcher = useCallback((url: string) => {
    // 拦截第一页请求：如果有初始数据且还没使用过，直接返回
    if (
      url.includes(`page=1`) &&
      initialDataRef.current &&
      !firstPageFetchedRef.current
    ) {
      firstPageFetchedRef.current = true
      return Promise.resolve(initialDataRef.current)
    }
    return fetcher(url)
  }, [])

  const {
    data: topicPages,
    size,
    setSize,
    isLoading: isTopicLoading,
    mutate,
  } = useSWRInfinite<TopicListResult>(getKey, topicFetcher, {
    revalidateFirstPage: false, // 不重新验证第一页
    revalidateOnFocus: true, // 聚焦时重新验证（保持浏览量等更新）
    revalidateOnMount: false, // 挂载时不请求（使用 fallback）
    fallbackData: initialData ? [initialData] : undefined,
  })

  // 当 routeParams 或 initialData 变化时，重置 refs（导航场景）
  useEffect(() => {
    initialDataRef.current = initialData
    firstPageFetchedRef.current = false
    // 同时也重置 SWR 缓存
    if (initialData) {
      mutate([initialData], false)
    }
  }, [
    routeParams.categoryId,
    routeParams.tagId,
    routeParams.sort,
    routeParams.filter,
    initialData,
    mutate,
  ])

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
        className="max-sm:pb-4 sm:sticky sm:top-0 sm:z-1 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
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

const CategoryHeader = React.memo(function CategoryHeader({
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
})
