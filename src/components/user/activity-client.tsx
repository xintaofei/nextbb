"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import useSWRInfinite from "swr/infinite"
import ActivityTimeline from "./activity-timeline"
import type { ActivityType, ActivitiesResponse } from "@/types/activity"

type ActivityClientProps = {
  userId: string
  username: string
  initialType?: string
  isOwnProfile: boolean
  isAdmin: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ActivityClient({
  userId,
  username,
  initialType = "all",
  isOwnProfile,
  isAdmin,
}: ActivityClientProps) {
  // 验证 initialType 是否为有效的 ActivityType
  const validTypes: ActivityType[] = [
    "all",
    "topics",
    "posts",
    "likes",
    "bookmarks",
  ]
  const initialActivityType = validTypes.includes(initialType as ActivityType)
    ? (initialType as ActivityType)
    : "all"

  const [activeFilter] = useState<ActivityType>(initialActivityType)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const hasPermission = isOwnProfile || isAdmin
  const getKey = (
    pageIndex: number,
    previousPageData: ActivitiesResponse | null
  ) => {
    // 如果上一页没有更多数据，返回 null
    if (previousPageData && !previousPageData.hasMore) return null

    // 返回 API URL
    return `/api/users/${userId}/activities?type=${activeFilter}&page=${
      pageIndex + 1
    }&pageSize=10`
  }

  const { data, size, setSize, isLoading, isValidating } =
    useSWRInfinite<ActivitiesResponse>(getKey, fetcher, {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
    })

  // 合并所有页的数据
  const allActivities = useMemo(() => {
    return data ? data.flatMap((page) => page.items) : []
  }, [data])

  // 检查是否还有更多数据
  const hasMore = useMemo(() => {
    if (!data || data.length === 0) return false
    return data[data.length - 1].hasMore
  }, [data])

  // 是否正在加载更多（不是第一页的加载）
  const isLoadingMore = useMemo(() => {
    return isValidating && size > 1 && hasMore
  }, [isValidating, size, hasMore])

  // 加载更多
  const loadMore = useCallback(() => {
    if (!isLoading && !isValidating && hasMore) {
      setSize(size + 1)
    }
  }, [isLoading, isValidating, hasMore, size, setSize])

  // 设置 Intersection Observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first.isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    const currentSentinel = sentinelRef.current
    if (currentSentinel) {
      observerRef.current.observe(currentSentinel)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loadMore])

  return (
    <ActivityTimeline
      activities={allActivities}
      activityType={activeFilter}
      username={username}
      hasMore={hasMore}
      hasPermission={hasPermission}
      isLoading={isLoading && size === 1}
      isLoadingMore={isLoadingMore}
      sentinelRef={sentinelRef}
    />
  )
}
