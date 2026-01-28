import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSessionUser } from "@/lib/server-auth"
import { AutomationEvents } from "@/lib/automation/event-bus"

type LikeToggleResult = {
  liked: boolean
  count: number
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await getServerSessionUser()
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: idStr } = await ctx.params
  let postId: bigint
  try {
    postId = BigInt(idStr)
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const post = await prisma.posts.findUnique({
    where: { id: postId },
    select: { id: true, is_deleted: true },
  })
  if (!post || post.is_deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const key = { post_id: postId, user_id: auth.userId }
  const exists = await prisma.post_likes.findUnique({
    where: { post_id_user_id: key },
    select: { post_id: true },
  })

  // 获取帖子作者信息
  const postWithAuthor = await prisma.posts.findUnique({
    where: { id: postId },
    select: { user_id: true },
  })

  if (!postWithAuthor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const isLiked = !exists

  if (exists) {
    await prisma.post_likes.delete({ where: { post_id_user_id: key } })
  } else {
    await prisma.post_likes.create({ data: { ...key } })
  }

  const count = await prisma.post_likes.count({ where: { post_id: postId } })

  // 只在点赞时触发事件(取消点赞不触发)
  if (isLiked) {
    // 查询点赞者送出的总点赞数
    const totalLikesGiven = await prisma.post_likes.count({
      where: { user_id: auth.userId },
    })

    // 查询帖子作者收到的总点赞数
    const totalLikesReceived = await prisma.post_likes.count({
      where: {
        post_id: {
          in: (
            await prisma.posts.findMany({
              where: { user_id: postWithAuthor.user_id },
              select: { id: true },
            })
          ).map((p) => p.id),
        },
      },
    })

    // 同时触发两个独立事件
    await Promise.all([
      // 送出点赞事件
      AutomationEvents.postLikeGiven({
        postId,
        userId: auth.userId,
        totalLikesGiven,
      }),
      // 收到点赞事件
      AutomationEvents.postLikeReceived({
        postId,
        postAuthorId: postWithAuthor.user_id,
        totalLikesReceived,
      }),
    ])
  }

  const response: LikeToggleResult = { liked: isLiked, count }
  return NextResponse.json(response, { status: 200 })
}
