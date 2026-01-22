"use client"

import { TopicControls } from "@/components/topic/topic-controls"
import { TopicSortTabs } from "@/components/topic/topic-sort-tabs"
import { TopicSortDrawer } from "@/components/topic/topic-sort-drawer"
import { NewTopicButton } from "@/components/new-topic/new-topic-button"
import { type SortValue } from "@/lib/route-utils"
import { cn } from "@/lib/utils"

type TopicHeaderBarProps = {
  categoryId?: string
  className?: string
  onSortStart?: (next: SortValue) => void
  onNewTopicClick: () => void
}

export function TopicHeaderBar({
  categoryId,
  className,
  onSortStart,
  onNewTopicClick,
}: TopicHeaderBarProps) {
  return (
    <div
      className={cn(
        "flex flex-row flex-wrap gap-4 items-center justify-between border-b max-sm:border-0",
        className
      )}
    >
      <div className="flex flex-row gap-2">
        <TopicControls
          className="max-sm:hidden"
          initialCategoryId={categoryId}
        />
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
      </div>
      <NewTopicButton onClick={onNewTopicClick} className="shrink-0" />
    </div>
  )
}
