import { z } from "zod"
import { TopicType, BountyType } from "@/types/topic-type"

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

// BOUNTY 类型 - 悬赏功能（单人/多人模式）
const bountySingleSchema = baseTopicSchema.extend({
  type: z.literal(TopicType.BOUNTY),
  bountyType: z.literal(BountyType.SINGLE),
  bountyTotal: z.number().int().positive(),
  bountySlots: z.literal(1),
  singleAmount: z.undefined().optional(),
})

const bountyMultipleSchema = baseTopicSchema
  .extend({
    type: z.literal(TopicType.BOUNTY),
    bountyType: z.literal(BountyType.MULTIPLE),
    bountyTotal: z.number().int().positive(),
    bountySlots: z.number().int().min(2),
    singleAmount: z.number().int().positive(),
  })
  .refine(
    (data) => {
      return data.bountyTotal === data.singleAmount * data.bountySlots
    },
    {
      message: "Bounty total must equal single amount × slots",
      path: ["bountyTotal"],
    }
  )

const bountyTopicSchema = z.discriminatedUnion("bountyType", [
  bountySingleSchema,
  bountyMultipleSchema,
])

// POLL 类型 - 需要投票选项和配置
const pollTopicSchema = baseTopicSchema
  .extend({
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
        maxChoices: z.number().int().positive().nullable().optional(),
        showResultsBeforeVote: z.boolean(),
        showVoterList: z.boolean(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      // 如果没有 pollConfig，跳过验证
      if (!data.pollConfig) return true

      const { allowMultiple, maxChoices } = data.pollConfig
      const optionsCount = data.pollOptions.length

      // 如果允许多选且设置了maxChoices
      if (allowMultiple && maxChoices !== null && maxChoices !== undefined) {
        // 必须大于1且不能超过选项数量
        return maxChoices > 1 && maxChoices <= optionsCount
      }
      return true
    },
    {
      message:
        "Max choices must be greater than 1 and not exceed the number of options",
      path: ["pollConfig", "maxChoices"],
    }
  )

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
  const bountySingleWithCredits = baseTopicSchema.extend({
    type: z.literal(TopicType.BOUNTY),
    bountyType: z.literal(BountyType.SINGLE),
    bountyTotal: z.number().int().positive().max(userCredits, {
      message: "Insufficient credits",
    }),
    bountySlots: z.literal(1),
    singleAmount: z.undefined().optional(),
  })

  const bountyMultipleWithCredits = baseTopicSchema
    .extend({
      type: z.literal(TopicType.BOUNTY),
      bountyType: z.literal(BountyType.MULTIPLE),
      bountyTotal: z.number().int().positive().max(userCredits, {
        message: "Insufficient credits",
      }),
      bountySlots: z.number().int().min(2),
      singleAmount: z.number().int().positive(),
    })
    .refine(
      (data) => {
        return data.bountyTotal === data.singleAmount * data.bountySlots
      },
      {
        message: "Bounty total must equal single amount × slots",
        path: ["bountyTotal"],
      }
    )

  return z.discriminatedUnion("bountyType", [
    bountySingleWithCredits,
    bountyMultipleWithCredits,
  ])
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
