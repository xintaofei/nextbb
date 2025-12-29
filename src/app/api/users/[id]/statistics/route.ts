import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Params = Promise<{ id: string }>

/**
 * 获取用户统计信息
 * GET /api/users/:id/statistics
 */
export async function GET(_req: Request, props: { params: Params }) {
  const params = await props.params
  const userId = BigInt(params.id)

  try {
    // 并行查询所有统计数据
    const [topicsCount, postsCount, likesReceived, followersCount, user] =
      await Promise.all([
        // 用户创建的话题数
        prisma.topics.count({
          where: { user_id: userId, is_deleted: false },
        }),
        // 用户创建的帖子数（回复数）
        prisma.posts.count({
          where: { user_id: userId, is_deleted: false },
        }),
        // 用户收到的点赞数
        prisma.post_likes.count({
          where: {
            post: {
              user_id: userId,
              is_deleted: false,
            },
          },
        }),
        // 粉丝数（关注该用户的人数）
        prisma.user_follows.count({
          where: { following_id: userId },
        }),
        // 获取用户基本信息
        prisma.users.findUnique({
          where: { id: userId },
          select: {
            id: true,
            is_deleted: true,
            created_at: true,
            credits: true,
          },
        }),
      ])

    // 验证用户是否存在
    if (!user || user.is_deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      topicsCount,
      postsCount,
      likesReceived,
      followersCount,
      credits: user.credits,
      joinedAt: user.created_at.toISOString(),
    })
  } catch (error) {
    console.error("Error fetching user statistics:", error)
    return NextResponse.json(
      { error: "Failed to fetch user statistics" },
      { status: 500 }
    )
  }
}
