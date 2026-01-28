import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSessionUser } from "@/lib/server-auth"

type BookmarkToggleResult = {
  bookmarked: boolean
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
  const exists = await prisma.post_bookmarks.findUnique({
    where: { post_id_user_id: key },
    select: { post_id: true },
  })

  if (exists) {
    await prisma.post_bookmarks.delete({ where: { post_id_user_id: key } })
  } else {
    await prisma.post_bookmarks.create({ data: { ...key } })
  }

  const count = await prisma.post_bookmarks.count({
    where: { post_id: postId },
  })
  const response: BookmarkToggleResult = { bookmarked: !exists, count }
  return NextResponse.json(response, { status: 200 })
}
