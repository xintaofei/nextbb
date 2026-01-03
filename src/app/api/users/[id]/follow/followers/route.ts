import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Params = Promise<{ id: string }>

/**
 * 获取用户的粉丝列表
 * GET /api/users/:id/follow/followers
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

    // 查询粉丝列表（关注该用户的人）
    const followers = await prisma.user_follows.findMany({
      where: { following_id: userId },
      select: {
        follower: {
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
    const formattedFollowers = followers.map((follow) => ({
      id: follow.follower.id.toString(),
      username: follow.follower.name,
      nickname: null,
      avatar: follow.follower.avatar,
      is_admin: follow.follower.is_admin,
      created_at: follow.follower.created_at.toISOString(),
      followedAt: follow.created_at.toISOString(),
    }))

    return NextResponse.json({
      followers: formattedFollowers,
      total: followers.length,
    })
  } catch (error) {
    console.error("Error fetching followers:", error)
    return NextResponse.json(
      { error: "Failed to fetch followers" },
      { status: 500 }
    )
  }
}
