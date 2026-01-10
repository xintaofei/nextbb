import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { TopicType } from "@/types/topic-type"

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await ctx.params

    // 验证主题 ID 格式
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

    // 验证主题类型为 QUESTION
    if (topic.type !== TopicType.QUESTION) {
      return NextResponse.json(
        { error: "Topic is not a question" },
        { status: 404 }
      )
    }

    // 查询采纳记录
    const acceptance = await prisma.question_acceptances.findUnique({
      where: { topic_id: topicId },
      select: {
        post_id: true,
        accepted_by: true,
        accepted_at: true,
        accepter: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        post: {
          select: {
            id: true,
            floor_number: true,
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    })

    if (!acceptance) {
      return NextResponse.json({ hasAcceptance: false }, { status: 200 })
    }

    return NextResponse.json(
      {
        hasAcceptance: true,
        postId: String(acceptance.post_id),
        floorNumber: acceptance.post.floor_number,
        answeredBy: {
          id: String(acceptance.post.user.id),
          name: acceptance.post.user.name,
          avatar: acceptance.post.user.avatar,
        },
        acceptedBy: {
          id: String(acceptance.accepter.id),
          name: acceptance.accepter.name,
          avatar: acceptance.accepter.avatar,
        },
        acceptedAt: acceptance.accepted_at.toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching acceptance:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
