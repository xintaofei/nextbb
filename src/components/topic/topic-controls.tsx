"use client"

import { useCallback, useMemo, useTransition } from "react"
import { usePathname, useRouter, useParams } from "next/navigation"
import { CategorySelect } from "@/components/filters/category-select"
import { TagSelect } from "@/components/filters/tag-select"
import {
  parseRouteSegments,
  buildRoutePath,
  type RouteParams,
} from "@/lib/route-utils"

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
  const pathname = usePathname()
  const params = useParams<{ segments?: string[]; locale?: string }>()
  const [isPending, startTransition] = useTransition()

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
      const newPath = buildRoutePath(newParams, params.locale)

      startTransition(() => {
        router.push(newPath)
        router.refresh()
      })
      onChange?.(next)
    },
    [routeParams, params.locale, router, onChange, startTransition]
  )

  const navigateToCategory = useCallback(
    (nextCategoryId: string | undefined) => {
      // 构建新路由参数
      const newParams: RouteParams = {
        ...routeParams,
        categoryId: nextCategoryId,
      }

      // 生成新路由路径
      const newPath = buildRoutePath(newParams, params.locale)

      startTransition(() => {
        router.push(newPath)
        router.refresh()
      })
      onChange?.({ categoryId: nextCategoryId, tagId })
    },
    [routeParams, params.locale, router, startTransition, tagId, onChange]
  )

  return (
    <div className={className}>
      <div className="flex flex-row gap-2 items-center">
        <CategorySelect
          value={categoryId}
          onChange={(v) => navigateToCategory(v)}
          className="w-36"
          clearable
        />
        <TagSelect
          value={tagId}
          onChange={(v) => updateQuery({ categoryId, tagId: v })}
          className="w-36"
          clearable
        />
      </div>
    </div>
  )
}
