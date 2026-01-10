import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

type Params = Promise<{ id: string }>

/**
 * 关注或取消关注用户
 * POST /api/users/:id/follow
 */
export async function POST(_req: Request, props: { params: Params }) {
  const params = await props.params
  const targetUserId = BigInt(params.id)

  try {
    // 获取当前登录用户
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUserIdBigInt = sessionUser.userId

    // 不能关注自己
    if (currentUserIdBigInt === targetUserId) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      )
    }

    // 验证目标用户是否存在
    const targetUser = await prisma.users.findUnique({
      where: { id: targetUserId },
      select: { id: true, is_deleted: true },
    })

    if (!targetUser || targetUser.is_deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 查询是否已关注
    const existingFollow = await prisma.user_follows.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: currentUserIdBigInt,
          following_id: targetUserId,
        },
      },
    })

    if (existingFollow) {
      // 已关注，则取消关注
      await prisma.user_follows.delete({
        where: {
          follower_id_following_id: {
            follower_id: currentUserIdBigInt,
            following_id: targetUserId,
          },
        },
      })

      return NextResponse.json({
        success: true,
        isFollowing: false,
        message: "Unfollowed successfully",
      })
    } else {
      // 未关注，则关注
      await prisma.user_follows.create({
        data: {
          follower_id: currentUserIdBigInt,
          following_id: targetUserId,
        },
      })

      return NextResponse.json({
        success: true,
        isFollowing: true,
        message: "Followed successfully",
      })
    }
  } catch (error) {
    console.error("Error toggling follow:", error)
    return NextResponse.json(
      { error: "Failed to toggle follow" },
      { status: 500 }
    )
  }
}
