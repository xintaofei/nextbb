"use client"

import { TopicControls } from "@/components/topic/topic-controls"
import { TopicSortTabs } from "@/components/topic/topic-sort-tabs"
import { TopicSortDrawer } from "@/components/topic/topic-sort-drawer"
import { NewTopicButton } from "@/components/new-topic/new-topic-button"
import { HotTags } from "@/components/topic/hot-tags"
import { type SortValue } from "@/lib/route-utils"

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
    <div className={className}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-row flex-wrap justify-between items-center gap-4">
          <HotTags />
          <TopicControls
            className="max-sm:hidden flex flex-row gap-2"
            initialCategoryId={categoryId}
          />
        </div>
        <div className="flex flex-row flex-wrap gap-4 items-center justify-between">
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
          <NewTopicButton onClick={onNewTopicClick} className="shrink-0" />
        </div>
      </div>
    </div>
  )
}
