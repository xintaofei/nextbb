import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import { TopicType } from "@/types/topic-type"
import { z } from "zod"

const VoteSchema = z.object({
  optionIds: z.array(z.string()).min(1),
})

type VoteRequest = z.infer<typeof VoteSchema>

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
    const body = (await req.json()) as VoteRequest
    const validation = VoteSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error },
        { status: 400 }
      )
    }

    const { optionIds } = validation.data

    // 查询主题信息
    const topic = await prisma.topics.findFirst({
      where: {
        id: topicId,
        is_deleted: false,
      },
      select: {
        id: true,
        type: true,
        status: true,
        end_time: true,
      },
    })

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    if (topic.type !== TopicType.POLL) {
      return NextResponse.json(
        { error: "Topic is not a poll" },
        { status: 404 }
      )
    }

    // 验证主题状态
    if (topic.status === "CLOSED") {
      return NextResponse.json({ error: "Poll is closed" }, { status: 403 })
    }

    // 验证投票是否截止
    if (topic.end_time && new Date(topic.end_time) < new Date()) {
      return NextResponse.json({ error: "Poll has ended" }, { status: 403 })
    }

    // 查询投票配置
    const config = await prisma.poll_configs.findUnique({
      where: { topic_id: topicId },
    })

    if (!config) {
      return NextResponse.json(
        { error: "Poll config not found" },
        { status: 404 }
      )
    }

    // 验证选项数量
    if (!config.allow_multiple && optionIds.length > 1) {
      return NextResponse.json(
        { error: "Only single choice is allowed" },
        { status: 400 }
      )
    }

    if (
      config.allow_multiple &&
      config.max_choices &&
      optionIds.length > config.max_choices
    ) {
      return NextResponse.json(
        { error: `Maximum ${config.max_choices} choices allowed` },
        { status: 400 }
      )
    }

    // 验证选项是否存在
    const validOptions = await prisma.poll_options.findMany({
      where: {
        id: { in: optionIds.map((id) => BigInt(id)) },
        topic_id: topicId,
        is_deleted: false,
      },
      select: { id: true },
    })

    if (validOptions.length !== optionIds.length) {
      return NextResponse.json(
        { error: "Invalid options provided" },
        { status: 400 }
      )
    }

    // 使用事务处理投票
    await prisma.$transaction(async (tx) => {
      // 删除用户之前的投票记录
      await tx.poll_votes.deleteMany({
        where: {
          user_id: auth.userId,
          option: {
            topic_id: topicId,
          },
        },
      })

      // 创建新的投票记录
      await tx.poll_votes.createMany({
        data: optionIds.map((optionId) => ({
          option_id: BigInt(optionId),
          user_id: auth.userId,
          created_at: new Date(),
        })),
      })
    })

    // 查询更新后的统计数据
    const updatedOptions = await prisma.poll_options.findMany({
      where: {
        topic_id: topicId,
        is_deleted: false,
      },
      select: {
        id: true,
        votes: {
          select: {
            user_id: true,
          },
        },
      },
    })

    const totalVoteCount = updatedOptions.reduce(
      (sum, opt) => sum + opt.votes.length,
      0
    )

    const optionsResponse = updatedOptions.map((opt) => {
      const voteCount = opt.votes.length
      const percentage =
        totalVoteCount > 0 ? (voteCount / totalVoteCount) * 100 : 0

      return {
        id: String(opt.id),
        voteCount,
        percentage: Math.round(percentage * 100) / 100,
      }
    })

    return NextResponse.json({
      success: true,
      message: "Vote recorded successfully",
      updatedOptions: optionsResponse,
    })
  } catch (error) {
    console.error("Error recording vote:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - 取消投票
export async function DELETE(
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

    // 查询主题信息
    const topic = await prisma.topics.findFirst({
      where: {
        id: topicId,
        is_deleted: false,
      },
      select: {
        id: true,
        type: true,
        status: true,
        end_time: true,
      },
    })

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    if (topic.type !== TopicType.POLL) {
      return NextResponse.json(
        { error: "Topic is not a poll" },
        { status: 404 }
      )
    }

    // 验证主题状态
    if (topic.status === "CLOSED") {
      return NextResponse.json({ error: "Poll is closed" }, { status: 403 })
    }

    // 验证投票是否截止
    if (topic.end_time && new Date(topic.end_time) < new Date()) {
      return NextResponse.json({ error: "Poll has ended" }, { status: 403 })
    }

    // 删除用户的投票记录
    const result = await prisma.poll_votes.deleteMany({
      where: {
        user_id: auth.userId,
        option: {
          topic_id: topicId,
        },
      },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: "No vote found to cancel" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Vote canceled successfully",
    })
  } catch (error) {
    console.error("Error canceling vote:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
