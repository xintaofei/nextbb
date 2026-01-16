import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { stripHtmlAndTruncate } from "@/lib/utils"

type TopTopicItem = {
  id: string
  title: string
  createdAt: string
  views: number
  likesCount: number
}

type TopReplyItem = {
  id: string
  contentPreview: string
  topicId: string
  topicTitle: string
  createdAt: string
  likesCount: number
  floorNumber: number
}

type TopContentResponse = {
  topTopics: TopTopicItem[]
  topReplies: TopReplyItem[]
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await ctx.params
    let userId: bigint
    try {
      userId = BigInt(idStr)
    } catch {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // 解析查询参数
    const url = new URL(req.url)
    const topicLimit = Math.min(
      Math.max(Number(url.searchParams.get("topicLimit") ?? "6"), 1),
      20
    )
    const replyLimit = Math.min(
      Math.max(Number(url.searchParams.get("replyLimit") ?? "6"), 1),
      20
    )

    // 验证用户是否存在
    const user = await prisma.users.findFirst({
      where: { id: userId, is_deleted: false },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 并行查询热门主题和热门回复
    const [topicsData, repliesData] = await Promise.all([
      // 查询热门主题
      prisma.topics.findMany({
        where: { user_id: userId, is_deleted: false },
        select: {
          id: true,
          title: true,
          created_at: true,
          views: true,
          posts: {
            where: { floor_number: 1, is_deleted: false },
            select: {
              id: true,
            },
          },
        },
        orderBy: [{ views: "desc" }, { created_at: "desc" }],
        take: topicLimit,
      }),
      // 查询热门回复
      prisma.posts.findMany({
        where: {
          user_id: userId,
          is_deleted: false,
          floor_number: { gt: 1 }, // 排除首帖
        },
        select: {
          id: true,
          content: true,
          created_at: true,
          floor_number: true,
          topic: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        take: replyLimit * 3, // 多取一些，后面根据点赞数排序
      }),
    ])

    // 获取主题首帖的点赞数
    const firstPostIds = topicsData
      .map((t) => t.posts[0]?.id)
      .filter((id): id is bigint => id !== undefined)

    const topicLikesMap = new Map<string, number>()
    if (firstPostIds.length > 0) {
      const likeCounts = await prisma.post_likes.groupBy({
        by: ["post_id"],
        where: { post_id: { in: firstPostIds } },
        _count: { post_id: true },
      })
      likeCounts.forEach((lc) => {
        topicLikesMap.set(String(lc.post_id), lc._count.post_id)
      })
    }

    // 获取回复的点赞数
    const replyIds = repliesData.map((r) => r.id)
    const replyLikesMap = new Map<string, number>()
    if (replyIds.length > 0) {
      const likeCounts = await prisma.post_likes.groupBy({
        by: ["post_id"],
        where: { post_id: { in: replyIds } },
        _count: { post_id: true },
      })
      likeCounts.forEach((lc) => {
        replyLikesMap.set(String(lc.post_id), lc._count.post_id)
      })
    }

    // 构造热门主题响应
    const topTopics: TopTopicItem[] = topicsData.map((topic) => ({
      id: String(topic.id),
      title: topic.title,
      createdAt: topic.created_at.toISOString(),
      views: topic.views,
      likesCount: topicLikesMap.get(String(topic.posts[0]?.id)) ?? 0,
    }))

    // 构造热门回复响应，按点赞数排序并限制数量
    const topReplies: TopReplyItem[] = repliesData
      .map((reply) => ({
        id: String(reply.id),
        contentPreview: stripHtmlAndTruncate(reply.content, 100),
        topicId: String(reply.topic.id),
        topicTitle: reply.topic.title,
        createdAt: reply.created_at.toISOString(),
        likesCount: replyLikesMap.get(String(reply.id)) ?? 0,
        floorNumber: reply.floor_number,
      }))
      .sort((a, b) => b.likesCount - a.likesCount)
      .slice(0, replyLimit)

    const response: TopContentResponse = {
      topTopics,
      topReplies,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching user top content:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
