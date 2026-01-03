import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Params = Promise<{ id: string }>

/**
 * 获取用户的关注列表
 * GET /api/users/:id/follow/following
 */
export async function GET(_req: Request, props: { params: Params }) {
  const params = await props.params
  const userId = BigInt(params.id)

  try {
    // 验证用户是否存在
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, is_deleted: true },
    })

    if (!user || user.is_deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 查询关注列表（该用户关注的人）
    const following = await prisma.user_follows.findMany({
      where: { follower_id: userId },
      select: {
        following: {
          select: {
            id: true,
            name: true,
            avatar: true,
            is_admin: true,
            created_at: true,
          },
        },
        created_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
    })

    // 格式化返回数据
    const formattedFollowing = following.map((follow) => ({
      id: follow.following.id.toString(),
      username: follow.following.name,
      nickname: null,
      avatar: follow.following.avatar,
      is_admin: follow.following.is_admin,
      created_at: follow.following.created_at.toISOString(),
      followedAt: follow.created_at.toISOString(),
    }))

    return NextResponse.json({
      following: formattedFollowing,
      total: following.length,
    })
  } catch (error) {
    console.error("Error fetching following:", error)
    return NextResponse.json(
      { error: "Failed to fetch following" },
      { status: 500 }
    )
  }
}
