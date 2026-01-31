import { ReactNode, memo } from "react"
import { TopicType } from "@/types/topic-type"
import { PollDisplay } from "@/components/topic/poll-display"
import { BountyDisplay } from "@/components/topic/bounty-display"
import { QuestionAcceptanceDisplay } from "@/components/topic/question-acceptance-display"
import { LotteryDisplay } from "@/components/topic/lottery-display"
import { TopicInfoResult } from "@/types/topic"

interface TopicTypeSlotProps {
  index: number
  topicId: string
  topicInfo: TopicInfoResult["topic"] | null
}

/**
 * 根据主题类型渲染特定内容插槽
 * 只在第一个帖子（楼主）显示主题类型特定内容
 */
export const TopicTypeSlot = memo(function TopicTypeSlot({
  index,
  topicId,
  topicInfo,
}: TopicTypeSlotProps): ReactNode {
  // 只在第一个帖子（楼主）显示主题类型特定内容
  if (index !== 0 || !topicInfo) return null

  switch (topicInfo.type) {
    case TopicType.POLL:
      return (
        <PollDisplay
          topicId={topicId}
          topicStatus={topicInfo.status || "ACTIVE"}
          endTime={topicInfo.endTime || null}
        />
      )
    case TopicType.BOUNTY:
      return (
        <BountyDisplay
          topicId={topicId}
          topicIsSettled={topicInfo.isSettled || false}
        />
      )
    case TopicType.QUESTION:
      return (
        <QuestionAcceptanceDisplay
          topicId={topicId}
          topicIsSettled={topicInfo.isSettled || false}
        />
      )
    case TopicType.LOTTERY:
      return <LotteryDisplay topicId={topicId} />
    default:
      return null
  }
})
