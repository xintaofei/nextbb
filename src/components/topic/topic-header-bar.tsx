"use client"

import { TopicControls } from "@/components/topic/topic-controls"
import { TopicSortTabs } from "@/components/topic/topic-sort-tabs"
import { NewTopicButton } from "@/components/new-topic/new-topic-button"
import { HotTags } from "@/components/topic/hot-tags"

type TopicHeaderBarProps = {
  categoryId?: string
  className?: string
  onSortStart?: (next: "latest" | "hot") => void
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
      <div className="flex flex-col gap-3">
        <div className="flex flex-row items-center gap-3">
          <TopicControls
            className="flex flex-row gap-2"
            initialCategoryId={categoryId}
          />
          <HotTags />
        </div>
        <div className="flex flex-row items-center justify-between gap-3">
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
