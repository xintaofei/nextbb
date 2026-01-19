"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useMemo, useState, useTransition } from "react"
import {
  parseRouteSegments,
  buildRoutePath,
  type RouteParams,
  type SortValue as RouteSortValue,
} from "@/lib/route-utils"

type SortValue = "latest" | "hot" | "community" | RouteSortValue

type TopicSortTabsProps = {
  className?: string
  onPendingChange?: (pending: boolean) => void
  onSortStart?: (next: RouteSortValue) => void
}

export function TopicSortTabs({
  className,
  onPendingChange,
  onSortStart,
}: TopicSortTabsProps) {
  const tc = useTranslations("Common")
  const router = useRouter()
  const params = useParams<{ segments?: string[] }>()
  const [isPending, startTransition] = useTransition()

  // 从路由段中提取当前排序
  const routeParams = useMemo(() => {
    const parsed = parseRouteSegments(params.segments)
    return parsed.valid ? (parsed as RouteParams) : {}
  }, [params.segments])

  const currentSort: SortValue = useMemo(() => {
    // 优先使用路由中的排序参数
    if (routeParams.sort === "top") return "top"
    if (routeParams.sort === "new") return "new"
    if (routeParams.sort === "latest") return "latest"
    return "latest"
  }, [routeParams])

  const [selectedSort, setSelectedSort] = useState<SortValue>(currentSort)

  useEffect(() => {
    onPendingChange?.(isPending)
  }, [isPending, onPendingChange])

  useEffect(() => {
    setSelectedSort(currentSort)
  }, [currentSort])

  function setSort(next: SortValue) {
    if (next === currentSort) {
      setSelectedSort(next)
      return
    }

    // 只处理新路由支持的排序值
    if (next !== "top" && next !== "new" && next !== "latest") {
      return
    }

    onSortStart?.(next as RouteSortValue)
    setSelectedSort(next)

    // 构建新路由参数
    const newParams: RouteParams = {
      ...routeParams,
      sort: next as RouteSortValue,
    }

    // 生成新路由路径
    const newPath = buildRoutePath(newParams)

    startTransition(() => {
      router.push(newPath)
      router.refresh()
    })
  }

  function getSortPath(sort: RouteSortValue) {
    return buildRoutePath({
      ...routeParams,
      sort,
    })
  }

  function handleSortClick(e: React.MouseEvent, sort: RouteSortValue) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      e.stopPropagation()
      return
    }
    e.preventDefault()
    setSort(sort)
  }

  return (
    <Tabs value={selectedSort} onValueChange={() => {}} className={className}>
      <TabsList>
        <TabsTrigger className="md:px-4" value="latest" asChild>
          <Link
            href={getSortPath("latest")}
            onClick={(e) => handleSortClick(e, "latest")}
          >
            {tc("Tabs.latest")}
          </Link>
        </TabsTrigger>
        <TabsTrigger className="md:px-4" value="top" asChild>
          <Link
            href={getSortPath("top")}
            onClick={(e) => handleSortClick(e, "top")}
          >
            {tc("Tabs.top")}
          </Link>
        </TabsTrigger>
        <TabsTrigger className="md:px-4" value="new" asChild>
          <Link
            href={getSortPath("new")}
            onClick={(e) => handleSortClick(e, "new")}
          >
            {tc("Tabs.new")}
          </Link>
        </TabsTrigger>
        <TabsTrigger className="md:px-4" value="hot" disabled>
          {tc("Tabs.hot")}
        </TabsTrigger>
        <TabsTrigger className="md:px-4" value="community" disabled>
          {tc("Tabs.community")}
        </TabsTrigger>
        <TabsTrigger
          className="hidden md:px-4 md:inline-flex"
          value="my"
          disabled
        >
          {tc("Tabs.my")}
        </TabsTrigger>
        <TabsTrigger
          className="hidden md:px-4 md:inline-flex"
          value="bookmark"
          disabled
        >
          {tc("Tabs.bookmark")}
        </TabsTrigger>
        <TabsTrigger
          className="hidden md:px-4 md:inline-flex"
          value="like"
          disabled
        >
          {tc("Tabs.like")}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
