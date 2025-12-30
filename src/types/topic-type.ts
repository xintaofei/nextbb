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

// 主题状态枚举
export const TopicStatus = {
  ACTIVE: "ACTIVE",
  CLOSED: "CLOSED",
  DRAFT: "DRAFT",
} as const

export type TopicStatusValue = (typeof TopicStatus)[keyof typeof TopicStatus]

// 投票选项类型
export type PollOption = {
  id: string
  text: string
  voteCount: number
  userVoted: boolean
}

// 投票选项详情类型（包含百分比和排名）
export type PollOptionDetail = {
  id: string
  text: string
  voteCount: number
  percentage: number
  rank: number
  userVoted: boolean
  voters?:
    | {
        id: string
        name: string
        avatar: string
      }[]
    | null
}

// 投票配置类型
export type PollConfig = {
  topicId: string
  allowMultiple: boolean
  maxChoices: number | null
  showResultsBeforeVote: boolean
  showVoterList: boolean
  totalVotes: number
  totalVoteCount: number
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

// 悬赏类型枚举
export const BountyType = {
  SINGLE: "SINGLE",
  MULTIPLE: "MULTIPLE",
} as const

export type BountyTypeValue = (typeof BountyType)[keyof typeof BountyType]

// 悬赏配置类型
export type BountyConfig = {
  topicId: string
  bountyTotal: number
  bountyType: BountyTypeValue
  bountySlots: number
  remainingSlots: number
  singleAmount: number | null
}

// 悬赏流水类型
export type BountyReward = {
  id: string
  topicId: string
  postId: string
  receiver: {
    id: string
    name: string
    avatar: string
  }
  amount: number
  createdAt: string
}

// 扩展的主题信息类型
export type TopicTypeInfo = {
  type: TopicTypeValue
  status?: TopicStatusValue
  endTime?: string | null
  isSettled?: boolean
  pollOptions?: PollOption[] | null
  pollConfig?: PollConfig | null
  lotteryConfig?: LotteryConfig | null
  bountyConfig?: BountyConfig | null
}

// 列表页主题类型扩展字段
export type TopicListTypeInfo = {
  type: TopicTypeValue
  status?: TopicStatusValue
  endTime?: string | null
  pollOptionCount?: number | null
  lotteryEndTime?: string | null
  isAnswered?: boolean | null
  bountyTotal?: number | null
}
