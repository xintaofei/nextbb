"use client"

import { TopicControls } from "@/components/topic/topic-controls"
import { TopicSortTabs } from "@/components/topic/topic-sort-tabs"
import { TopicSortDrawer } from "@/components/topic/topic-sort-drawer"
import { type SortValue } from "@/lib/route-utils"
import { cn } from "@/lib/utils"

type TopicHeaderBarProps = {
  categoryId?: string
  className?: string
  onSortStart?: (next: SortValue) => void
}

export function TopicHeaderBar({
  categoryId,
  className,
  onSortStart,
}: TopicHeaderBarProps) {
  return (
    <div
      className={cn(
        "flex flex-row flex-wrap gap-4 items-center justify-between border-b max-sm:border-0",
        className
      )}
    >
      <TopicSortTabs
        className="max-sm:hidden"
        onSortStart={(next) => {
          onSortStart?.(next)
        }}
      />
      <TopicSortDrawer
        className="hidden max-sm:flex"
        onSortStart={(next) => {
          onSortStart?.(next)
        }}
      />
      <TopicControls initialCategoryId={categoryId} />
    </div>
  )
}
