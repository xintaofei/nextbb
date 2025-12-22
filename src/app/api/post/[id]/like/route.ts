import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

type LikeToggleResult = {
  liked: boolean
  count: number
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await getSessionUser()
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

  if (exists) {
    await prisma.post_likes.delete({ where: { post_id_user_id: key } })
  } else {
    await prisma.post_likes.create({ data: { ...key } })
  }

  const count = await prisma.post_likes.count({ where: { post_id: postId } })
  const response: LikeToggleResult = { liked: !exists, count }
  return NextResponse.json(response, { status: 200 })
}
