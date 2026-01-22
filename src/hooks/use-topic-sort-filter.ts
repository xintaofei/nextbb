"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState, useTransition } from "react"
import {
  parseRouteSegments,
  buildRoutePath,
  type RouteParams,
  type SortValue,
  type FilterValue,
} from "@/lib/route-utils"

export type TabValue = SortValue | FilterValue

type UseTopicSortFilterOptions = {
  onPendingChange?: (pending: boolean) => void
  onSortStart?: (next: SortValue) => void
  onFilterStart?: (next: FilterValue) => void
}

export function useTopicSortFilter(options: UseTopicSortFilterOptions = {}) {
  const router = useRouter()
  const params = useParams<{ segments?: string[] }>()
  const [isPending, startTransition] = useTransition()

  // 从路由段中提取当前参数
  const routeParams = useMemo(() => {
    const parsed = parseRouteSegments(params.segments)
    return parsed.valid ? (parsed as RouteParams) : {}
  }, [params.segments])

  // 当前排序值
  const currentSort: SortValue = useMemo(() => {
    if (routeParams.sort === "top") return "top"
    if (routeParams.sort === "new") return "new"
    if (routeParams.sort === "latest") return "latest"
    return "latest"
  }, [routeParams])

  // 当前过滤值
  const currentFilter: FilterValue | undefined = useMemo(() => {
    if (routeParams.filter === "community") return "community"
    if (routeParams.filter === "my") return "my"
    return undefined
  }, [routeParams])

  // 当前选中的tab（排序或过滤）
  const currentTab: TabValue = useMemo(() => {
    return currentFilter || currentSort
  }, [currentFilter, currentSort])

  const [selectedTab, setSelectedTab] = useState<TabValue>(currentTab)

  // 同步路由变化到本地状态
  useEffect(() => {
    setSelectedTab(currentTab)
  }, [currentTab])

  // 通知pending状态变化
  useEffect(() => {
    options.onPendingChange?.(isPending)
  }, [isPending, options])

  // 设置排序
  function setSort(next: SortValue): void {
    if (next === currentSort && !currentFilter) {
      setSelectedTab(next)
      return
    }

    options.onSortStart?.(next)
    setSelectedTab(next)

    const newParams: RouteParams = {
      ...routeParams,
      sort: next,
      filter: undefined, // 切换排序时清除过滤
    }

    const newPath = buildRoutePath(newParams)

    startTransition(() => {
      router.push(newPath)
      router.refresh()
    })
  }

  // 设置过滤
  function setFilter(next: FilterValue): void {
    if (next === currentFilter) {
      setSelectedTab(next)
      return
    }

    options.onFilterStart?.(next)
    setSelectedTab(next)

    const newParams: RouteParams = {
      ...routeParams,
      filter: next,
    }

    const newPath = buildRoutePath(newParams)

    startTransition(() => {
      router.push(newPath)
      router.refresh()
    })
  }

  // 切换tab（自动判断是排序还是过滤）
  function setTab(value: TabValue): void {
    if (value === "community" || value === "my") {
      setFilter(value)
    } else {
      setSort(value)
    }
  }

  // 获取指定排序的路径
  function getSortPath(sort: SortValue): string {
    return buildRoutePath({
      ...routeParams,
      sort,
      filter: undefined, // 切换排序时清除过滤
    })
  }

  // 获取指定过滤的路径
  function getFilterPath(filter: FilterValue): string {
    return buildRoutePath({
      ...routeParams,
      filter,
    })
  }

  // 获取指定tab的路径
  function getTabPath(value: TabValue): string {
    if (value === "community" || value === "my") {
      return getFilterPath(value)
    } else {
      return getSortPath(value)
    }
  }

  return {
    currentSort,
    currentFilter,
    currentTab,
    selectedTab,
    setSort,
    setFilter,
    setTab,
    getSortPath,
    getFilterPath,
    getTabPath,
    isPending,
    routeParams,
  }
}
