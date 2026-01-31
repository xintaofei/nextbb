"use client"

import { useCallback, useMemo, useTransition } from "react"
import { useRouter, useParams } from "next/navigation"
import { CategorySelect } from "@/components/filters/category-select"
import { TagSelect } from "@/components/filters/tag-select"
import {
  parseRouteSegments,
  buildRoutePath,
  type RouteParams,
} from "@/lib/route-utils"
import { cn } from "@/lib/utils"

type TopicControlsState = {
  categoryId?: string
  tagId?: string
}

type TopicControlsProps = {
  initialCategoryId?: string
  initialTagId?: string
  className?: string
  onChange?: (state: TopicControlsState) => void
}

export function TopicControls({
  initialCategoryId,
  initialTagId,
  className,
  onChange,
}: TopicControlsProps) {
  const router = useRouter()
  const params = useParams<{ segments?: string[] }>()
  const [, startTransition] = useTransition()

  // 从路由段中提取当前参数
  const routeParams = useMemo(() => {
    const parsed = parseRouteSegments(params.segments)
    return parsed.valid ? (parsed as RouteParams) : {}
  }, [params.segments])

  const categoryId = useMemo(
    () => routeParams.categoryId ?? initialCategoryId,
    [routeParams.categoryId, initialCategoryId]
  )
  const tagId = useMemo(
    () => routeParams.tagId ?? initialTagId,
    [routeParams.tagId, initialTagId]
  )

  const updateQuery = useCallback(
    (next: TopicControlsState) => {
      // 构建新路由参数
      const newParams: RouteParams = {
        ...routeParams,
        categoryId: next.categoryId,
        tagId: next.tagId,
      }

      // 生成新路由路径
      const newPath = buildRoutePath(newParams)

      startTransition(() => {
        router.push(newPath)
        router.refresh()
      })
      onChange?.(next)
    },
    [routeParams, router, onChange, startTransition]
  )

  const navigateToCategory = useCallback(
    (nextCategoryId: string | undefined) => {
      // 构建新路由参数
      const newParams: RouteParams = {
        ...routeParams,
        categoryId: nextCategoryId,
      }

      // 生成新路由路径
      const newPath = buildRoutePath(newParams)

      startTransition(() => {
        router.push(newPath)
        router.refresh()
      })
      onChange?.({ categoryId: nextCategoryId, tagId })
    },
    [routeParams, router, startTransition, tagId, onChange]
  )

  const handleCategoryChange = useCallback(
    (v: string | undefined) => {
      navigateToCategory(v)
    },
    [navigateToCategory]
  )

  const handleTagChange = useCallback(
    (v: string | undefined) => {
      updateQuery({ categoryId, tagId: v })
    },
    [updateQuery, categoryId]
  )

  return (
    <div className={cn("flex flex-row gap-2 items-center", className)}>
      <CategorySelect
        className="min-w-36"
        value={categoryId}
        onChange={handleCategoryChange}
        clearable
      />
      <TagSelect
        className="min-w-36"
        value={tagId}
        onChange={handleTagChange}
        clearable
      />
    </div>
  )
}
