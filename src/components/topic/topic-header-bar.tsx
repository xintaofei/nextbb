"use client"

import { TopicControls } from "@/components/topic/topic-controls"
import { TopicSortTabs } from "@/components/topic/topic-sort-tabs"
import { NewTopicButton } from "@/components/new-topic/new-topic-button"
import { HotTags } from "@/components/topic/hot-tags"

type TopicHeaderBarProps = {
  categoryId?: string
  className?: string
  onSortStart?: (next: "latest" | "hot" | "community") => void
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
        <div className="flex flex-row flex-wrap items-center gap-4">
          <TopicControls
            className="flex flex-row gap-2"
            initialCategoryId={categoryId}
          />
          <HotTags />
        </div>
        <div className="flex flex-row flex-wrap gap-4 items-center justify-between">
          <TopicSortTabs
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
