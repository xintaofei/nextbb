import { z } from "zod"
import {
  TopicType,
  BountyType,
  DrawType,
  AlgorithmType,
} from "@/types/topic-type"

// 翻译函数类型
type TranslateFn = (key: string) => string

// 创建话题表单验证 Schema 的工厂函数
export function createTopicFormSchema(t: TranslateFn) {
  // 基础字段验证
  const baseTopicSchema = z.object({
    title: z
      .string()
      .min(5, t("Topic.Validation.title.min"))
      .max(100, t("Topic.Validation.title.max")),
    categoryId: z
      .string()
      .regex(/^\d+$/, t("Topic.Validation.categoryId.invalid")),
    content: z
      .string()
      .min(20, t("Topic.Validation.content.min"))
      .max(5000, t("Topic.Validation.content.max")),
    tags: z
      .array(z.string().max(15, t("Topic.Validation.tag.maxLength")))
      .max(5, t("Topic.Validation.tags.maxCount")),
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

  // BOUNTY 类型 - 悬赏功能(单人/多人模式)
  const bountySingleSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.BOUNTY),
    bountyType: z
      .enum([BountyType.SINGLE, BountyType.MULTIPLE])
      .refine((val) => val === BountyType.SINGLE, {
        message: t("Topic.Validation.bounty.typeMismatch"),
      }),
    bountyTotal: z
      .number()
      .int()
      .positive(t("Topic.Validation.bounty.totalPositive")),
    bountySlots: z.literal(1),
    singleAmount: z.number().int().positive().optional(),
  })

  const bountyMultipleSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.BOUNTY),
    bountyType: z
      .enum([BountyType.SINGLE, BountyType.MULTIPLE])
      .refine((val) => val === BountyType.MULTIPLE, {
        message: t("Topic.Validation.bounty.typeMismatch"),
      }),
    bountyTotal: z
      .number()
      .int()
      .positive(t("Topic.Validation.bounty.totalPositive")),
    bountySlots: z.number().int().min(2, t("Topic.Validation.bounty.slotsMin")),
    singleAmount: z
      .number()
      .int()
      .positive(t("Topic.Validation.bounty.singleAmountPositive")),
  })

  // POLL 类型 - 需要投票选项和配置
  const pollTopicSchema = baseTopicSchema
    .extend({
      type: z.literal(TopicType.POLL),
      pollOptions: z
        .array(
          z.object({
            text: z
              .string()
              .min(1, t("Topic.Validation.pollOptions.min"))
              .max(256, t("Topic.Validation.pollOptions.optionMaxLength")),
          })
        )
        .min(2, t("Topic.Validation.pollOptions.min"))
        .max(10, t("Topic.Validation.pollOptions.max")),
      endTime: z.string().refine(
        (val) => {
          const date = new Date(val)
          return date > new Date()
        },
        { message: t("Topic.Validation.pollEndTime.future") }
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
        message: t("Topic.Validation.pollConfig.maxChoices"),
        path: ["pollConfig", "maxChoices"],
      }
    )

  // LOTTERY 类型 - 需要抽奖配置
  // 定时开奖 + 间隔楼层
  const lotteryScheduledIntervalSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.LOTTERY),
    drawType: z.literal(DrawType.SCHEDULED),
    endTime: z.string().refine(
      (val) => {
        const date = new Date(val)
        return date > new Date()
      },
      { message: t("Topic.Validation.lottery.endTimeFuture") }
    ),
    algorithmType: z.literal(AlgorithmType.INTERVAL),
    floorInterval: z
      .number()
      .int()
      .positive(t("Topic.Validation.lottery.floorInterval")),
    entryCost: z
      .number()
      .int()
      .nonnegative(t("Topic.Validation.lottery.entryCost")),
  })

  // 定时开奖 + 随机楼层
  const lotteryScheduledRandomSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.LOTTERY),
    drawType: z.literal(DrawType.SCHEDULED),
    endTime: z.string().refine(
      (val) => {
        const date = new Date(val)
        return date > new Date()
      },
      { message: t("Topic.Validation.lottery.endTimeFuture") }
    ),
    algorithmType: z.literal(AlgorithmType.RANDOM),
    winnerCount: z
      .number()
      .int()
      .min(1, t("Topic.Validation.lottery.winnerCount"))
      .max(100, t("Topic.Validation.lottery.winnerCount")),
    entryCost: z
      .number()
      .int()
      .nonnegative(t("Topic.Validation.lottery.entryCost")),
  })

  // 定时开奖 + 指定楼层
  const lotteryScheduledFixedSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.LOTTERY),
    drawType: z.literal(DrawType.SCHEDULED),
    endTime: z.string().refine(
      (val) => {
        const date = new Date(val)
        return date > new Date()
      },
      { message: t("Topic.Validation.lottery.endTimeFuture") }
    ),
    algorithmType: z.literal(AlgorithmType.FIXED),
    fixedFloors: z
      .array(z.number().int().min(2))
      .min(1)
      .refine((floors) => floors.every((f) => f > 1), {
        message: t("Topic.Validation.lottery.fixedFloors"),
      }),
    entryCost: z
      .number()
      .int()
      .nonnegative(t("Topic.Validation.lottery.entryCost")),
  })

  // 满人开奖 + 间隔楼层
  const lotteryThresholdIntervalSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.LOTTERY),
    drawType: z.literal(DrawType.THRESHOLD),
    participantThreshold: z
      .number()
      .int()
      .positive(t("Topic.Validation.lottery.participantThreshold")),
    algorithmType: z.literal(AlgorithmType.INTERVAL),
    floorInterval: z
      .number()
      .int()
      .positive(t("Topic.Validation.lottery.floorInterval")),
    entryCost: z
      .number()
      .int()
      .nonnegative(t("Topic.Validation.lottery.entryCost")),
  })

  // 满人开奖 + 随机楼层
  const lotteryThresholdRandomSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.LOTTERY),
    drawType: z.literal(DrawType.THRESHOLD),
    participantThreshold: z
      .number()
      .int()
      .positive(t("Topic.Validation.lottery.participantThreshold")),
    algorithmType: z.literal(AlgorithmType.RANDOM),
    winnerCount: z
      .number()
      .int()
      .min(1, t("Topic.Validation.lottery.winnerCount"))
      .max(100, t("Topic.Validation.lottery.winnerCount")),
    entryCost: z
      .number()
      .int()
      .nonnegative(t("Topic.Validation.lottery.entryCost")),
  })

  // 满人开奖 + 指定楼层
  const lotteryThresholdFixedSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.LOTTERY),
    drawType: z.literal(DrawType.THRESHOLD),
    participantThreshold: z
      .number()
      .int()
      .positive(t("Topic.Validation.lottery.participantThreshold")),
    algorithmType: z.literal(AlgorithmType.FIXED),
    fixedFloors: z
      .array(z.number().int().min(2))
      .min(1)
      .refine((floors) => floors.every((f) => f > 1), {
        message: t("Topic.Validation.lottery.fixedFloors"),
      }),
    entryCost: z
      .number()
      .int()
      .nonnegative(t("Topic.Validation.lottery.entryCost")),
  })

  // 即抽即中 + 间隔楼层
  const lotteryInstantIntervalSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.LOTTERY),
    drawType: z.literal(DrawType.INSTANT),
    algorithmType: z.literal(AlgorithmType.INTERVAL),
    floorInterval: z
      .number()
      .int()
      .positive(t("Topic.Validation.lottery.floorInterval")),
    entryCost: z
      .number()
      .int()
      .nonnegative(t("Topic.Validation.lottery.entryCost")),
  })

  // 即抽即中 + 随机楼层
  const lotteryInstantRandomSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.LOTTERY),
    drawType: z.literal(DrawType.INSTANT),
    algorithmType: z.literal(AlgorithmType.RANDOM),
    winnerCount: z
      .number()
      .int()
      .min(1, t("Topic.Validation.lottery.winnerCount"))
      .max(100, t("Topic.Validation.lottery.winnerCount")),
    entryCost: z
      .number()
      .int()
      .nonnegative(t("Topic.Validation.lottery.entryCost")),
  })

  // 即抽即中 + 指定楼层
  const lotteryInstantFixedSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.LOTTERY),
    drawType: z.literal(DrawType.INSTANT),
    algorithmType: z.literal(AlgorithmType.FIXED),
    fixedFloors: z
      .array(z.number().int().min(2))
      .min(1)
      .refine((floors) => floors.every((f) => f > 1), {
        message: t("Topic.Validation.lottery.fixedFloors"),
      }),
    entryCost: z
      .number()
      .int()
      .nonnegative(t("Topic.Validation.lottery.entryCost")),
  })

  // TUTORIAL 类型 - 无额外字段
  const tutorialTopicSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.TUTORIAL),
  })

  // 使用 union 根据 type 字段动态验证
  return z.union([
    generalTopicSchema,
    questionTopicSchema,
    bountySingleSchema,
    bountyMultipleSchema,
    pollTopicSchema,
    lotteryScheduledIntervalSchema,
    lotteryScheduledRandomSchema,
    lotteryScheduledFixedSchema,
    lotteryThresholdIntervalSchema,
    lotteryThresholdRandomSchema,
    lotteryThresholdFixedSchema,
    lotteryInstantIntervalSchema,
    lotteryInstantRandomSchema,
    lotteryInstantFixedSchema,
    tutorialTopicSchema,
  ])
}

// 创建带用户积分验证的 schema 工厂函数
export function createTopicFormSchemaWithCredits(
  userCredits: number,
  t: TranslateFn
) {
  // 基础字段验证
  const baseTopicSchema = z.object({
    title: z
      .string()
      .min(5, t("Topic.Validation.title.min"))
      .max(100, t("Topic.Validation.title.max")),
    categoryId: z
      .string()
      .regex(/^\d+$/, t("Topic.Validation.categoryId.invalid")),
    content: z
      .string()
      .min(20, t("Topic.Validation.content.min"))
      .max(5000, t("Topic.Validation.content.max")),
    tags: z
      .array(z.string().max(15, t("Topic.Validation.tag.maxLength")))
      .max(5, t("Topic.Validation.tags.maxCount")),
    isPinned: z.boolean().optional(),
    isCommunity: z.boolean().optional(),
  })

  // GENERAL 类型
  const generalTopicSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.GENERAL),
  })

  // QUESTION 类型
  const questionTopicSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.QUESTION),
  })

  // BOUNTY 类型(带积分验证)
  const bountySingleWithCredits = baseTopicSchema.extend({
    type: z.literal(TopicType.BOUNTY),
    bountyType: z
      .enum([BountyType.SINGLE, BountyType.MULTIPLE])
      .refine((val) => val === BountyType.SINGLE, {
        message: t("Topic.Validation.bounty.typeMismatch"),
      }),
    bountyTotal: z
      .number()
      .int()
      .positive(t("Topic.Validation.bounty.totalPositive"))
      .max(userCredits, {
        message: t("Topic.Validation.bounty.insufficientCredits"),
      }),
    bountySlots: z.literal(1),
    singleAmount: z.number().int().positive().optional(),
  })

  const bountyMultipleWithCredits = baseTopicSchema.extend({
    type: z.literal(TopicType.BOUNTY),
    bountyType: z
      .enum([BountyType.SINGLE, BountyType.MULTIPLE])
      .refine((val) => val === BountyType.MULTIPLE, {
        message: t("Topic.Validation.bounty.typeMismatch"),
      }),
    bountyTotal: z
      .number()
      .int()
      .positive(t("Topic.Validation.bounty.totalPositive"))
      .max(userCredits, {
        message: t("Topic.Validation.bounty.insufficientCredits"),
      }),
    bountySlots: z.number().int().min(2, t("Topic.Validation.bounty.slotsMin")),
    singleAmount: z
      .number()
      .int()
      .positive(t("Topic.Validation.bounty.singleAmountPositive")),
  })

  // POLL 类型
  const pollTopicSchema = baseTopicSchema
    .extend({
      type: z.literal(TopicType.POLL),
      pollOptions: z
        .array(
          z.object({
            text: z
              .string()
              .min(1, t("Topic.Validation.pollOptions.min"))
              .max(256, t("Topic.Validation.pollOptions.optionMaxLength")),
          })
        )
        .min(2, t("Topic.Validation.pollOptions.min"))
        .max(10, t("Topic.Validation.pollOptions.max")),
      endTime: z.string().refine(
        (val) => {
          const date = new Date(val)
          return date > new Date()
        },
        { message: t("Topic.Validation.pollEndTime.future") }
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
        if (!data.pollConfig) return true
        const { allowMultiple, maxChoices } = data.pollConfig
        const optionsCount = data.pollOptions.length
        if (allowMultiple && maxChoices !== null && maxChoices !== undefined) {
          return maxChoices > 1 && maxChoices <= optionsCount
        }
        return true
      },
      {
        message: t("Topic.Validation.pollConfig.maxChoices"),
        path: ["pollConfig", "maxChoices"],
      }
    )

  // LOTTERY 类型 - 定时开奖 + 间隔楼层
  const lotteryScheduledIntervalSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.LOTTERY),
    drawType: z.literal(DrawType.SCHEDULED),
    endTime: z.string().refine(
      (val) => {
        const date = new Date(val)
        return date > new Date()
      },
      { message: t("Topic.Validation.lottery.endTimeFuture") }
    ),
    algorithmType: z.literal(AlgorithmType.INTERVAL),
    floorInterval: z
      .number()
      .int()
      .positive(t("Topic.Validation.lottery.floorInterval")),
    entryCost: z
      .number()
      .int()
      .nonnegative(t("Topic.Validation.lottery.entryCost")),
  })

  // 定时开奖 + 随机楼层
  const lotteryScheduledRandomSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.LOTTERY),
    drawType: z.literal(DrawType.SCHEDULED),
    endTime: z.string().refine(
      (val) => {
        const date = new Date(val)
        return date > new Date()
      },
      { message: t("Topic.Validation.lottery.endTimeFuture") }
    ),
    algorithmType: z.literal(AlgorithmType.RANDOM),
    winnerCount: z
      .number()
      .int()
      .min(1, t("Topic.Validation.lottery.winnerCount"))
      .max(100, t("Topic.Validation.lottery.winnerCount")),
    entryCost: z
      .number()
      .int()
      .nonnegative(t("Topic.Validation.lottery.entryCost")),
  })

  // 定时开奖 + 指定楼层
  const lotteryScheduledFixedSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.LOTTERY),
    drawType: z.literal(DrawType.SCHEDULED),
    endTime: z.string().refine(
      (val) => {
        const date = new Date(val)
        return date > new Date()
      },
      { message: t("Topic.Validation.lottery.endTimeFuture") }
    ),
    algorithmType: z.literal(AlgorithmType.FIXED),
    fixedFloors: z
      .array(z.number().int().min(2))
      .min(1)
      .refine((floors) => floors.every((f) => f > 1), {
        message: t("Topic.Validation.lottery.fixedFloors"),
      }),
    entryCost: z
      .number()
      .int()
      .nonnegative(t("Topic.Validation.lottery.entryCost")),
  })

  // 满人开奖 + 间隔楼层
  const lotteryThresholdIntervalSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.LOTTERY),
    drawType: z.literal(DrawType.THRESHOLD),
    participantThreshold: z
      .number()
      .int()
      .positive(t("Topic.Validation.lottery.participantThreshold")),
    algorithmType: z.literal(AlgorithmType.INTERVAL),
    floorInterval: z
      .number()
      .int()
      .positive(t("Topic.Validation.lottery.floorInterval")),
    entryCost: z
      .number()
      .int()
      .nonnegative(t("Topic.Validation.lottery.entryCost")),
  })

  // 满人开奖 + 随机楼层
  const lotteryThresholdRandomSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.LOTTERY),
    drawType: z.literal(DrawType.THRESHOLD),
    participantThreshold: z
      .number()
      .int()
      .positive(t("Topic.Validation.lottery.participantThreshold")),
    algorithmType: z.literal(AlgorithmType.RANDOM),
    winnerCount: z
      .number()
      .int()
      .min(1, t("Topic.Validation.lottery.winnerCount"))
      .max(100, t("Topic.Validation.lottery.winnerCount")),
    entryCost: z
      .number()
      .int()
      .nonnegative(t("Topic.Validation.lottery.entryCost")),
  })

  // 满人开奖 + 指定楼层
  const lotteryThresholdFixedSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.LOTTERY),
    drawType: z.literal(DrawType.THRESHOLD),
    participantThreshold: z
      .number()
      .int()
      .positive(t("Topic.Validation.lottery.participantThreshold")),
    algorithmType: z.literal(AlgorithmType.FIXED),
    fixedFloors: z
      .array(z.number().int().min(2))
      .min(1)
      .refine((floors) => floors.every((f) => f > 1), {
        message: t("Topic.Validation.lottery.fixedFloors"),
      }),
    entryCost: z
      .number()
      .int()
      .nonnegative(t("Topic.Validation.lottery.entryCost")),
  })

  // 即抽即中 + 间隔楼层
  const lotteryInstantIntervalSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.LOTTERY),
    drawType: z.literal(DrawType.INSTANT),
    algorithmType: z.literal(AlgorithmType.INTERVAL),
    floorInterval: z
      .number()
      .int()
      .positive(t("Topic.Validation.lottery.floorInterval")),
    entryCost: z
      .number()
      .int()
      .nonnegative(t("Topic.Validation.lottery.entryCost")),
  })

  // 即抽即中 + 随机楼层
  const lotteryInstantRandomSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.LOTTERY),
    drawType: z.literal(DrawType.INSTANT),
    algorithmType: z.literal(AlgorithmType.RANDOM),
    winnerCount: z
      .number()
      .int()
      .min(1, t("Topic.Validation.lottery.winnerCount"))
      .max(100, t("Topic.Validation.lottery.winnerCount")),
    entryCost: z
      .number()
      .int()
      .nonnegative(t("Topic.Validation.lottery.entryCost")),
  })

  // 即抽即中 + 指定楼层
  const lotteryInstantFixedSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.LOTTERY),
    drawType: z.literal(DrawType.INSTANT),
    algorithmType: z.literal(AlgorithmType.FIXED),
    fixedFloors: z
      .array(z.number().int().min(2))
      .min(1)
      .refine((floors) => floors.every((f) => f > 1), {
        message: t("Topic.Validation.lottery.fixedFloors"),
      }),
    entryCost: z
      .number()
      .int()
      .nonnegative(t("Topic.Validation.lottery.entryCost")),
  })

  // TUTORIAL 类型
  const tutorialTopicSchema = baseTopicSchema.extend({
    type: z.literal(TopicType.TUTORIAL),
  })

  return z.union([
    generalTopicSchema,
    questionTopicSchema,
    bountySingleWithCredits,
    bountyMultipleWithCredits,
    pollTopicSchema,
    lotteryScheduledIntervalSchema,
    lotteryScheduledRandomSchema,
    lotteryScheduledFixedSchema,
    lotteryThresholdIntervalSchema,
    lotteryThresholdRandomSchema,
    lotteryThresholdFixedSchema,
    lotteryInstantIntervalSchema,
    lotteryInstantRandomSchema,
    lotteryInstantFixedSchema,
    tutorialTopicSchema,
  ])
}

// 为了保持向后兼容，导出旧的类型
export type TopicFormData = z.infer<ReturnType<typeof createTopicFormSchema>>
export type LotteryTopicFormData = Extract<
  TopicFormData,
  { type: typeof TopicType.LOTTERY }
>

// 导出默认的 schema（使用英文消息作为后备）
const defaultT = (key: string) => key
export const topicFormSchema = createTopicFormSchema(defaultT)
export const createBountySchemaWithCredits = (userCredits: number) => {
  return createTopicFormSchemaWithCredits(userCredits, defaultT)
}
