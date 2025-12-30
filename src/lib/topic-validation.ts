import { z } from "zod"
import { TopicType } from "@/types/topic-type"

// 基础字段验证
const baseTopicSchema = z.object({
  title: z.string().min(5).max(100),
  categoryId: z.string().regex(/^\d+$/),
  content: z.string().min(20).max(5000),
  tags: z.array(z.string().max(15)).max(5),
  isPinned: z.boolean().optional(),
  isCommunity: z.boolean().optional(),
})

// GENERAL 类型 - 无额外字段
const generalTopicSchema = baseTopicSchema.extend({
  type: z.literal(TopicType.GENERAL),
})

// QUESTION 类型 - 无额外字段
const questionTopicSchema = baseTopicSchema.extend({
  type: z.literal(TopicType.QUESTION),
})

// BOUNTY 类型 - 需要悬赏积分
const bountyTopicSchema = baseTopicSchema.extend({
  type: z.literal(TopicType.BOUNTY),
  rewardPoints: z.number().int().positive(),
})

// POLL 类型 - 需要投票选项和配置
const pollTopicSchema = baseTopicSchema.extend({
  type: z.literal(TopicType.POLL),
  pollOptions: z
    .array(
      z.object({
        text: z.string().min(1).max(256),
      })
    )
    .min(2)
    .max(10),
  endTime: z.string().refine(
    (val) => {
      const date = new Date(val)
      return date > new Date()
    },
    { message: "Poll end time must be in the future" }
  ),
  pollConfig: z
    .object({
      allowMultiple: z.boolean(),
      maxChoices: z.number().int().positive().optional(),
      showResultsBeforeVote: z.boolean(),
      showVoterList: z.boolean(),
    })
    .optional(),
})

// LOTTERY 类型 - 需要抽奖配置
const lotteryTopicSchema = baseTopicSchema.extend({
  type: z.literal(TopicType.LOTTERY),
  lotteryEndTime: z.string().refine(
    (val) => {
      const date = new Date(val)
      return date > new Date()
    },
    { message: "Lottery end time must be in the future" }
  ),
  lotteryRules: z.string().min(10).max(500),
  winnerCount: z.number().int().positive().max(100),
  minCredits: z.number().int().nonnegative().optional().nullable(),
})

// TUTORIAL 类型 - 无额外字段
const tutorialTopicSchema = baseTopicSchema.extend({
  type: z.literal(TopicType.TUTORIAL),
})

// 使用 discriminatedUnion 根据 type 字段动态验证
export const topicFormSchema = z.discriminatedUnion("type", [
  generalTopicSchema,
  questionTopicSchema,
  bountyTopicSchema,
  pollTopicSchema,
  lotteryTopicSchema,
  tutorialTopicSchema,
])

export type TopicFormData = z.infer<typeof topicFormSchema>

// 创建带用户积分验证的 bounty schema 工厂函数
export function createBountySchemaWithCredits(userCredits: number) {
  return baseTopicSchema.extend({
    type: z.literal(TopicType.BOUNTY),
    rewardPoints: z.number().int().positive().max(userCredits, {
      message: "Reward points cannot exceed your available credits",
    }),
  })
}

// 创建完整的带积分验证的 schema
export function createTopicFormSchemaWithCredits(userCredits: number) {
  return z.discriminatedUnion("type", [
    generalTopicSchema,
    questionTopicSchema,
    createBountySchemaWithCredits(userCredits),
    pollTopicSchema,
    lotteryTopicSchema,
    tutorialTopicSchema,
  ])
}
