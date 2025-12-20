"use client"

import { useCallback, useMemo, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CategorySelect } from "@/components/filters/category-select"
import { TagSelect } from "@/components/filters/tag-select"

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
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const categoryFromUrl = searchParams.get("categoryId") ?? undefined
  const tagFromUrl = searchParams.get("tagId") ?? undefined

  const categoryId = useMemo(
    () => categoryFromUrl ?? initialCategoryId,
    [categoryFromUrl, initialCategoryId]
  )
  const tagId = useMemo(
    () => tagFromUrl ?? initialTagId,
    [tagFromUrl, initialTagId]
  )

  const updateQuery = useCallback(
    (next: TopicControlsState) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next.categoryId) {
        params.set("categoryId", next.categoryId)
      } else {
        params.delete("categoryId")
      }
      if (next.tagId) {
        params.set("tagId", next.tagId)
      } else {
        params.delete("tagId")
      }
      params.set("page", "1")
      const url = `${pathname}?${params.toString()}`
      startTransition(() => {
        router.replace(url)
        router.refresh()
      })
      onChange?.(next)
    },
    [pathname, router, searchParams, onChange, startTransition]
  )

  return (
    <div className={className}>
      <div className="flex flex-row gap-2 items-center">
        <CategorySelect
          value={categoryId}
          onChange={(v) => updateQuery({ categoryId: v, tagId })}
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
