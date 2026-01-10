import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type InteractionUser = {
  rank: number
  user: {
    id: string
    name: string
    avatar: string
  }
  likeCount: number
}

type SocialInteractionsResponse = {
  topLikers: InteractionUser[]
  topLiked: InteractionUser[]
}

export async function GET(
  req: Request,
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

    // 解析查询参数
    const url = new URL(req.url)
    const limit = Math.min(
      Math.max(Number(url.searchParams.get("limit") ?? "10"), 1),
      50
    )

    // 验证用户是否存在
    const user = await prisma.users.findFirst({
      where: { id: userId, is_deleted: false },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 并行查询赞我最多和我赞最多
    const [topLikersData, topLikedData] = await Promise.all([
      // 赞我最多：查询谁给我的帖子点赞最多
      getTopLikers(userId, limit),
      // 我赞最多：查询我给谁的帖子点赞最多
      getTopLiked(userId, limit),
    ])

    const response: SocialInteractionsResponse = {
      topLikers: topLikersData,
      topLiked: topLikedData,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching social interactions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// 查询赞我最多的用户
async function getTopLikers(
  userId: bigint,
  limit: number
): Promise<InteractionUser[]> {
  // 获取目标用户的所有帖子ID
  const userPosts = await prisma.posts.findMany({
    where: { user_id: userId, is_deleted: false },
    select: { id: true },
  })

  const postIds = userPosts.map((p) => p.id)
  if (postIds.length === 0) {
    return []
  }

  // 查询这些帖子的点赞记录，按点赞用户分组统计
  const likesByUser = await prisma.post_likes.groupBy({
    by: ["user_id"],
    where: {
      post_id: { in: postIds },
      user_id: { not: userId }, // 排除自己
    },
    _count: { user_id: true },
    orderBy: { _count: { user_id: "desc" } },
    take: limit,
  })

  if (likesByUser.length === 0) {
    return []
  }

  // 获取用户信息
  const likerIds = likesByUser.map((l) => l.user_id)
  const users = await prisma.users.findMany({
    where: { id: { in: likerIds }, is_deleted: false },
    select: { id: true, name: true, avatar: true },
  })

  // 构建用户信息映射
  const userMap = new Map(users.map((u) => [String(u.id), u]))

  // 构造响应数据
  const result: InteractionUser[] = []
  let rank = 1
  for (const likeData of likesByUser) {
    const userData = userMap.get(String(likeData.user_id))
    if (userData) {
      result.push({
        rank,
        user: {
          id: String(userData.id),
          name: userData.name,
          avatar: userData.avatar,
        },
        likeCount: likeData._count.user_id,
      })
      rank++
    }
  }

  return result
}

// 查询我赞最多的用户
async function getTopLiked(
  userId: bigint,
  limit: number
): Promise<InteractionUser[]> {
  // 查询目标用户的所有点赞记录，关联到帖子作者
  const likesData = await prisma.post_likes.findMany({
    where: { user_id: userId },
    select: {
      post: {
        select: {
          user_id: true,
          is_deleted: true,
        },
      },
    },
  })

  // 统计每个作者被点赞的次数
  const likeCountsByAuthor = new Map<string, number>()
  for (const like of likesData) {
    if (like.post.is_deleted) continue
    const authorId = String(like.post.user_id)
    if (authorId === String(userId)) continue // 排除自己
    likeCountsByAuthor.set(
      authorId,
      (likeCountsByAuthor.get(authorId) ?? 0) + 1
    )
  }

  // 排序并取前N名
  const sortedAuthors = Array.from(likeCountsByAuthor.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)

  if (sortedAuthors.length === 0) {
    return []
  }

  // 获取用户信息
  const authorIds = sortedAuthors.map(([id]) => BigInt(id))
  const users = await prisma.users.findMany({
    where: { id: { in: authorIds }, is_deleted: false },
    select: { id: true, name: true, avatar: true },
  })

  // 构建用户信息映射
  const userMap = new Map(users.map((u) => [String(u.id), u]))

  // 构造响应数据
  const result: InteractionUser[] = []
  let rank = 1
  for (const [authorId, count] of sortedAuthors) {
    const userData = userMap.get(authorId)
    if (userData) {
      result.push({
        rank,
        user: {
          id: String(userData.id),
          name: userData.name,
          avatar: userData.avatar,
        },
        likeCount: count,
      })
      rank++
    }
  }

  return result
}
