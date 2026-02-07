import { memo } from "react"
import Link from "next/link"
import { TopicStatusTags } from "@/components/common/topic-status-tags"
import { CategoryBadge } from "@/components/common/category-badge"
import { TagBadge } from "@/components/common/tag-badge"
import { TopicInfoResult } from "@/types/topic"
import { TopicTypeValue } from "@/types/topic-type"

interface TopicHeaderProps {
  topicInfo: TopicInfoResult["topic"] | null
}

export const TopicHeader = memo(function TopicHeader({
  topicInfo,
}: TopicHeaderProps) {
  if (!topicInfo) return null

  return (
    <div className="flex flex-col gap-2">
      <div>
        <TopicStatusTags
          isPinned={topicInfo.isPinned}
          isCommunity={topicInfo.isCommunity}
          topicType={topicInfo.type as TopicTypeValue}
          size="size-5"
          className="align-middle mr-1"
        />
        <Link href={`/topic/${topicInfo.id}`} className="align-middle">
          <span className="cursor-pointer max-w-full text-2xl font-medium whitespace-normal wrap-break-word">
            {topicInfo.title}
          </span>
        </Link>
      </div>
      <div className="flex max-w-full flex-wrap gap-2 overflow-hidden">
        {topicInfo.category ? (
          <CategoryBadge
            id={topicInfo.category.id}
            icon={topicInfo.category.icon}
            name={topicInfo.category.name}
            description={topicInfo.category.description}
            bgColor={topicInfo.category.bgColor}
            textColor={topicInfo.category.textColor}
            darkBgColor={topicInfo.category.darkBgColor}
            darkTextColor={topicInfo.category.darkTextColor}
          />
        ) : null}
        {(topicInfo.tags ?? []).map((tag) => (
          <TagBadge
            key={tag.id}
            id={tag.id}
            icon={tag.icon}
            name={tag.name}
            description={tag.description}
            bgColor={tag.bgColor}
            textColor={tag.textColor}
            darkBgColor={tag.darkBgColor}
            darkTextColor={tag.darkTextColor}
          />
        ))}
      </div>
    </div>
  )
})
