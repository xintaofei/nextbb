import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type OverviewStatsResponse = {
  activeStats: {
    joinDays: number
    topicsCount: number
    postsCount: number
  }
  interactionStats: {
    likesGiven: number
    likesReceived: number
    bookmarksCount: number
    bookmarkedCount: number
  }
  honorStats: {
    badgesCount: number
  }
}

export async function GET(
  _req: Request,
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

    // 验证用户是否存在且未被删除
    const user = await prisma.users.findFirst({
      where: { id: userId, is_deleted: false },
      select: { id: true, created_at: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 并行查询所有统计数据
    const [
      topicsCount,
      postsCount,
      likesGivenCount,
      likesReceivedCount,
      bookmarksCount,
      bookmarkedCount,
      badgesCount,
    ] = await Promise.all([
      // 创建的主题总数
      prisma.topics.count({
        where: { user_id: userId, is_deleted: false },
      }),
      // 回复总数
      prisma.posts.count({
        where: { user_id: userId, is_deleted: false },
      }),
      // 送出的赞
      prisma.post_likes.count({
        where: { user_id: userId },
      }),
      // 收到的赞（用户帖子被点赞的总数）
      prisma.post_likes.count({
        where: {
          post: {
            user_id: userId,
            is_deleted: false,
          },
        },
      }),
      // 收藏数量
      prisma.post_bookmarks.count({
        where: { user_id: userId },
      }),
      // 被收藏数量（用户帖子被收藏的总数）
      prisma.post_bookmarks.count({
        where: {
          post: {
            user_id: userId,
            is_deleted: false,
          },
        },
      }),
      // 获得的徽章总数
      prisma.user_badges.count({
        where: { user_id: userId, is_deleted: false },
      }),
    ])

    // 计算加入天数
    const joinDays = Math.max(
      Math.floor(
        (Date.now() - user.created_at.getTime()) / (1000 * 60 * 60 * 24)
      ),
      0
    )

    const response: OverviewStatsResponse = {
      activeStats: {
        joinDays,
        topicsCount,
        postsCount,
      },
      interactionStats: {
        likesGiven: likesGivenCount,
        likesReceived: likesReceivedCount,
        bookmarksCount,
        bookmarkedCount,
      },
      honorStats: {
        badgesCount,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching user overview stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
