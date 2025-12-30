import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { TopicType } from "@/types/topic-type"

type BountyConfigResponse = {
  topicId: string
  bountyTotal: number
  bountyType: string
  bountySlots: number
  remainingSlots: number
  singleAmount: number | null
  rewards: {
    id: string
    postId: string
    receiver: {
      id: string
      name: string
      avatar: string
    }
    amount: number
    createdAt: string
  }[]
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
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

    // 查询主题信息
    const topic = await prisma.topics.findFirst({
      where: {
        id: topicId,
        is_deleted: false,
      },
      select: {
        id: true,
        type: true,
      },
    })

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    // 验证主题类型
    if (topic.type !== TopicType.BOUNTY) {
      return NextResponse.json(
        { error: "Topic is not a bounty" },
        { status: 404 }
      )
    }

    // 查询悬赏配置
    const bountyConfig = await prisma.bounty_configs.findUnique({
      where: { topic_id: topicId },
    })

    if (!bountyConfig) {
      return NextResponse.json(
        { error: "Bounty config not found" },
        { status: 404 }
      )
    }

    // 查询赏金流水记录
    const rewards = await prisma.bounty_rewards.findMany({
      where: { topic_id: topicId },
      select: {
        id: true,
        post_id: true,
        receiver_id: true,
        amount: true,
        created_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
    })

    // 查询所有领赏人信息
    const receiverIds = rewards.map(
      (r: { receiver_id: bigint }) => r.receiver_id
    )
    const users = await prisma.users.findMany({
      where: {
        id: { in: receiverIds },
      },
      select: {
        id: true,
        name: true,
        avatar: true,
      },
    })

    // 构建用户映射
    const userMap = new Map(
      users.map((u) => [
        String(u.id),
        { id: String(u.id), name: u.name, avatar: u.avatar },
      ])
    )

    // 组装响应数据
    const response: BountyConfigResponse = {
      topicId: String(topic.id),
      bountyTotal: bountyConfig.bounty_total,
      bountyType: bountyConfig.bounty_type,
      bountySlots: bountyConfig.bounty_slots,
      remainingSlots: bountyConfig.remaining_slots,
      singleAmount: bountyConfig.single_amount,
      rewards: rewards.map(
        (r: {
          id: bigint
          post_id: bigint
          receiver_id: bigint
          amount: number
          created_at: Date
        }) => {
          const receiver = userMap.get(String(r.receiver_id)) ?? {
            id: String(r.receiver_id),
            name: "Unknown User",
            avatar: "",
          }
          return {
            id: String(r.id),
            postId: String(r.post_id),
            receiver,
            amount: r.amount,
            createdAt: r.created_at.toISOString(),
          }
        }
      ),
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error("Error fetching bounty config:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
