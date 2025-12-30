import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import { TopicType, BountyType } from "@/types/topic-type"
import { generateId } from "@/lib/id"
import { z } from "zod"

interface BountyConfigsDelegate {
  findUnique(args: unknown): Promise<{
    topic_id: bigint
    bounty_total: number
    bounty_type: string
    bounty_slots: number
    remaining_slots: number
    single_amount: number | null
  } | null>
  update(args: unknown): Promise<{ remaining_slots: number }>
}

interface BountyRewardsDelegate {
  findFirst(args: unknown): Promise<{ id: bigint } | null>
  create(args: unknown): Promise<{ id: bigint }>
}

interface TopicsDelegate {
  findFirst(args: unknown): Promise<{
    id: bigint
    type: string
    user_id: bigint
    is_settled: boolean
  } | null>
  update(args: unknown): Promise<unknown>
}

interface PostsDelegate {
  findFirst(args: unknown): Promise<{
    id: bigint
    user_id: bigint
  } | null>
}

interface UsersDelegate {
  update(args: unknown): Promise<unknown>
}

interface TxClient {
  topics: TopicsDelegate
  posts: PostsDelegate
  users: UsersDelegate
  bounty_configs: BountyConfigsDelegate
  bounty_rewards: BountyRewardsDelegate
}

const RewardSchema = z.object({
  postId: z.string().regex(/^\d+$/),
})

type RewardRequest = z.infer<typeof RewardSchema>

type RewardResponse = {
  success: true
  amount: number
  remainingSlots: number
  isSettled: boolean
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户登录
    const auth = await getSessionUser()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: idStr } = await ctx.params

    // 验证主题ID
    let topicId: bigint
    try {
      topicId = BigInt(idStr)
    } catch {
      return NextResponse.json(
        { error: "Invalid topic ID format" },
        { status: 400 }
      )
    }

    // 验证请求体
    const body = (await req.json()) as RewardRequest
    const validation = RewardSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error },
        { status: 400 }
      )
    }

    const { postId: postIdStr } = validation.data

    // 验证回帖ID
    let postId: bigint
    try {
      postId = BigInt(postIdStr)
    } catch {
      return NextResponse.json(
        { error: "Invalid post ID format" },
        { status: 400 }
      )
    }

    // 使用事务处理给赏逻辑
    const result = await prisma.$transaction(async (tx: unknown) => {
      const client = tx as TxClient
      // 查询主题信息
      const topic = await client.topics.findFirst({
        where: {
          id: topicId,
          is_deleted: false,
        },
        select: {
          id: true,
          type: true,
          user_id: true,
          is_settled: true,
        },
      })

      if (!topic) {
        throw new Error("Topic not found")
      }

      // 验证主题类型
      if (topic.type !== TopicType.BOUNTY) {
        throw new Error("Topic is not a bounty")
      }

      // 验证是否为楼主
      if (topic.user_id !== auth.userId) {
        throw new Error("Only topic owner can reward")
      }

      // 验证是否已结算
      if (topic.is_settled) {
        throw new Error("Bounty already settled")
      }

      // 查询悬赏配置
      const bountyConfig = await client.bounty_configs.findUnique({
        where: { topic_id: topicId },
      })

      if (!bountyConfig) {
        throw new Error("Bounty config not found")
      }

      // 验证剩余名额
      if (bountyConfig.remaining_slots <= 0) {
        throw new Error("No remaining slots")
      }

      // 查询目标回帖
      const post = await client.posts.findFirst({
        where: {
          id: postId,
          topic_id: topicId,
          is_deleted: false,
        },
        select: {
          id: true,
          user_id: true,
        },
      })

      if (!post) {
        throw new Error("Post not found")
      }

      // 验证是否给自己发赏
      if (post.user_id === auth.userId) {
        throw new Error("Cannot reward yourself")
      }

      // 验证是否已获赏（通过查询 bounty_rewards 表）
      const existingReward = await client.bounty_rewards.findFirst({
        where: {
          topic_id: topicId,
          receiver_id: post.user_id,
        },
      })

      if (existingReward) {
        throw new Error("User already rewarded in this topic")
      }

      // 计算本次赏金金额
      const amount =
        bountyConfig.bounty_type === BountyType.SINGLE
          ? bountyConfig.bounty_total
          : (bountyConfig.single_amount ?? 0)

      if (amount <= 0) {
        throw new Error("Invalid reward amount")
      }

      // 增加领赏人积分
      await client.users.update({
        where: { id: post.user_id },
        data: {
          credits: {
            increment: amount,
          },
        },
      })

      // 创建赏金流水记录
      await client.bounty_rewards.create({
        data: {
          id: generateId(),
          topic_id: topicId,
          post_id: postId,
          giver_id: auth.userId,
          receiver_id: post.user_id,
          amount: amount,
          created_at: new Date(),
        },
      })

      // 递减剩余名额
      const updatedConfig = await client.bounty_configs.update({
        where: { topic_id: topicId },
        data: {
          remaining_slots: {
            decrement: 1,
          },
          updated_at: new Date(),
        },
        select: {
          remaining_slots: true,
        },
      })

      // 如果名额用完，标记主题为已结算
      let isSettled = false
      if (updatedConfig.remaining_slots === 0) {
        await client.topics.update({
          where: { id: topicId },
          data: {
            is_settled: true,
          },
        })
        isSettled = true
      }

      return {
        amount,
        remainingSlots: updatedConfig.remaining_slots,
        isSettled,
      }
    })

    const response: RewardResponse = {
      success: true,
      amount: result.amount,
      remainingSlots: result.remainingSlots,
      isSettled: result.isSettled,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error("Error rewarding post:", error)

    // 根据错误类型返回不同的状态码
    if (error instanceof Error) {
      const errorMessage = error.message

      if (
        errorMessage === "Topic not found" ||
        errorMessage === "Post not found"
      ) {
        return NextResponse.json({ error: errorMessage }, { status: 404 })
      }

      if (errorMessage === "Topic is not a bounty") {
        return NextResponse.json({ error: errorMessage }, { status: 404 })
      }

      if (
        errorMessage === "Only topic owner can reward" ||
        errorMessage === "Bounty already settled" ||
        errorMessage === "Cannot reward yourself" ||
        errorMessage === "User already rewarded in this topic" ||
        errorMessage === "No remaining slots"
      ) {
        return NextResponse.json({ error: errorMessage }, { status: 400 })
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
