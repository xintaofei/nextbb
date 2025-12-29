// 主题类型枚举
export const TopicType = {
  GENERAL: "GENERAL",
  QUESTION: "QUESTION",
  BOUNTY: "BOUNTY",
  POLL: "POLL",
  LOTTERY: "LOTTERY",
  TUTORIAL: "TUTORIAL",
} as const

export type TopicTypeValue = (typeof TopicType)[keyof typeof TopicType]

// 投票选项类型
export type PollOption = {
  id: string
  text: string
  voteCount: number
  userVoted: boolean
}

// 抽奖配置类型
export type LotteryConfig = {
  endTime: string
  rules: string
  winnerCount: number
  minCredits: number | null
  participantCount: number
  isDrawn: boolean
  userParticipated: boolean
  isWinner: boolean | null
}

// 扩展的主题信息类型
export type TopicTypeInfo = {
  type: TopicTypeValue
  acceptedAnswerId?: string | null
  rewardPoints?: number | null
  pollOptions?: PollOption[] | null
  lotteryConfig?: LotteryConfig | null
}

// 列表页主题类型扩展字段
export type TopicListTypeInfo = {
  type: TopicTypeValue
  rewardPoints?: number | null
  pollOptionCount?: number | null
  lotteryEndTime?: string | null
  isAnswered?: boolean | null
}
