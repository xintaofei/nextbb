import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

type Author = {
  id: string
  name: string
  avatar: string
}

type PostItem = {
  id: string
  author: Author
  content: string
  createdAt: string
  minutesAgo: number
  isDeleted: boolean
  likes: number
  liked: boolean
  bookmarks: number
  bookmarked: boolean
}

type PostPage = {
  items: PostItem[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await getSessionUser()
  const { id: idStr } = await ctx.params
  let topicId: bigint
  try {
    topicId = BigInt(idStr)
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const url = new URL(req.url)
  const page = Math.max(Number(url.searchParams.get("page") ?? "1"), 1)
  const pageSize = Math.max(Number(url.searchParams.get("pageSize") ?? "15"), 1)
  const skip = (page - 1) * pageSize

  const total = await prisma.posts.count({
    where: { topic_id: topicId },
  })

  const postsDb = await prisma.posts.findMany({
    where: { topic_id: topicId },
    select: {
      id: true,
      content: true,
      created_at: true,
      is_deleted: true,
      user: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { floor_number: "asc" },
    skip,
    take: pageSize,
  })

  type PostRow = {
    id: bigint
    content: string
    created_at: Date
    is_deleted: boolean
    user: { id: bigint; name: string; avatar: string }
  }
  const postIds = postsDb.map((p: PostRow) => p.id)
  const countsById = new Map<string, number>()
  const bookmarkCountsById = new Map<string, number>()
  if (postIds.length > 0) {
    const counts = await prisma.post_likes.groupBy({
      by: ["post_id"],
      _count: { post_id: true },
      where: { post_id: { in: postIds } },
    })
    for (const c of counts) {
      countsById.set(String(c.post_id), c._count.post_id ?? 0)
    }
    const bookmarkCounts = await prisma.post_bookmarks.groupBy({
      by: ["post_id"],
      _count: { post_id: true },
      where: { post_id: { in: postIds } },
    })
    for (const c of bookmarkCounts) {
      bookmarkCountsById.set(String(c.post_id), c._count.post_id ?? 0)
    }
  }
  const likedSet = new Set<string>()
  const bookmarkedSet = new Set<string>()
  if (auth && postIds.length > 0) {
    const likedRows = await prisma.post_likes.findMany({
      select: { post_id: true },
      where: { post_id: { in: postIds }, user_id: auth.userId },
    })
    for (const r of likedRows) likedSet.add(String(r.post_id))
    const bookmarkedRows = await prisma.post_bookmarks.findMany({
      select: { post_id: true },
      where: { post_id: { in: postIds }, user_id: auth.userId },
    })
    for (const r of bookmarkedRows) bookmarkedSet.add(String(r.post_id))
  }

  const items: PostItem[] = postsDb.map((p: PostRow) => {
    const idStr = String(p.id)
    return {
      id: idStr,
      author: {
        id: String(p.user.id),
        name: p.user.name,
        avatar: p.user.avatar,
      },
      content: p.content,
      createdAt: p.created_at.toISOString(),
      minutesAgo: Math.max(
        Math.round((Date.now() - p.created_at.getTime()) / 60000),
        0
      ),
      isDeleted: p.is_deleted,
      likes: countsById.get(idStr) ?? 0,
      liked: likedSet.has(idStr),
      bookmarks: bookmarkCountsById.get(idStr) ?? 0,
      bookmarked: bookmarkedSet.has(idStr),
    }
  })

  const hasMore = skip + items.length < total
  const result: PostPage = { items, page, pageSize, total, hasMore }
  return NextResponse.json(result)
}
