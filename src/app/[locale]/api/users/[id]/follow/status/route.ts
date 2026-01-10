import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

type Params = Promise<{ id: string }>

/**
 * 查询当前用户是否关注指定用户
 * GET /api/users/:id/follow/status
 */
export async function GET(_req: Request, props: { params: Params }) {
  const params = await props.params
  const targetUserId = BigInt(params.id)

  try {
    // 获取当前登录用户
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ isFollowing: false })
    }

    // 查询关注关系
    const follow = await prisma.user_follows.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: sessionUser.userId,
          following_id: targetUserId,
        },
      },
    })

    return NextResponse.json({
      isFollowing: !!follow,
    })
  } catch (error) {
    console.error("Error checking follow status:", error)
    return NextResponse.json(
      { error: "Failed to check follow status" },
      { status: 500 }
    )
  }
}
