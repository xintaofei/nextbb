import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getLocale } from "next-intl/server"
import {
  getTranslationsQuery,
  getTranslationFields,
  BadgeTranslation,
} from "@/lib/locale"

type LeaderboardType = "wealth" | "pioneer" | "expert" | "reputation"

type RankingUser = {
  rank: number
  user: {
    id: string
    name: string
    avatar: string
  }
  value: number
  badges: {
    id: string
    name: string
    icon: string
    level: number
    bgColor: string | null
    textColor: string | null
  }[]
}

type LeaderboardResponse = {
  type: LeaderboardType
  rankings: RankingUser[]
  updatedAt: string
}

export async function GET(req: Request) {
  const locale = await getLocale()
  const url = new URL(req.url)
  const type = url.searchParams.get("type") as LeaderboardType | null
  const limitParam = url.searchParams.get("limit")

  // 验证类型参数
  if (!type || !["wealth", "pioneer", "expert", "reputation"].includes(type)) {
    return NextResponse.json(
      { error: "Invalid leaderboard type" },
      { status: 400 }
    )
  }

  // 验证限制参数
  let limit = 100
  if (limitParam) {
    const parsedLimit = parseInt(limitParam, 10)
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return NextResponse.json(
        { error: "Invalid limit parameter" },
        { status: 400 }
      )
    }
    limit = parsedLimit
  }

  try {
    let rankings: RankingUser[] = []

    switch (type) {
      case "wealth":
        rankings = await getWealthRankings(limit, locale)
        break
      case "pioneer":
        rankings = await getPioneerRankings(limit, locale)
        break
      case "expert":
        rankings = await getExpertRankings(limit, locale)
        break
      case "reputation":
        rankings = await getReputationRankings(limit, locale)
        break
    }

    const response: LeaderboardResponse = {
      type,
      rankings,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// 富豪榜：基于用户当前的 credits 余额
async function getWealthRankings(
  limit: number,
  locale: string
): Promise<RankingUser[]> {
  const users = await prisma.users.findMany({
    where: {
      is_deleted: false,
    },
    select: {
      id: true,
      name: true,
      avatar: true,
      credits: true,
    },
    orderBy: {
      credits: "desc",
    },
    take: limit,
  })

  const userIds = users.map((u) => u.id)
  const userBadges = await getUserBadges(userIds, locale)

  return users.map((user, index) => ({
    rank: index + 1,
    user: {
      id: String(user.id),
      name: user.name,
      avatar: user.avatar,
    },
    value: user.credits,
    badges: userBadges.get(String(user.id)) || [],
  }))
}

// 先锋榜：基于近 7 天内用户发布的 Topic 和 Post 总数
async function getPioneerRankings(
  limit: number,
  locale: string
): Promise<RankingUser[]> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // 统计话题数
  const topicsCount = await prisma.topics.groupBy({
    by: ["user_id"],
    where: {
      is_deleted: false,
      created_at: {
        gte: sevenDaysAgo,
      },
    },
    _count: {
      id: true,
    },
  })

  // 统计帖子数
  const postsCount = await prisma.posts.groupBy({
    by: ["user_id"],
    where: {
      is_deleted: false,
      created_at: {
        gte: sevenDaysAgo,
      },
    },
    _count: {
      id: true,
    },
  })

  // 合并统计数据
  const activityMap = new Map<string, number>()
  topicsCount.forEach((t) => {
    const userId = String(t.user_id)
    activityMap.set(userId, (activityMap.get(userId) || 0) + t._count.id)
  })
  postsCount.forEach((p) => {
    const userId = String(p.user_id)
    activityMap.set(userId, (activityMap.get(userId) || 0) + p._count.id)
  })

  // 排序并获取前 N 名
  const sortedActivities = Array.from(activityMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)

  if (sortedActivities.length === 0) {
    return []
  }

  const userIds = sortedActivities.map(([userId]) => BigInt(userId))

  // 获取用户信息
  const users = await prisma.users.findMany({
    where: {
      id: { in: userIds },
      is_deleted: false,
    },
    select: {
      id: true,
      name: true,
      avatar: true,
    },
  })

  const userMap = new Map(users.map((u) => [String(u.id), u]))
  const userBadges = await getUserBadges(userIds, locale)

  return sortedActivities
    .map(([userId, activity], index) => {
      const user = userMap.get(userId)
      if (!user) return null
      return {
        rank: index + 1,
        user: {
          id: userId,
          name: user.name,
          avatar: user.avatar,
        },
        value: activity,
        badges: userBadges.get(userId) || [],
      }
    })
    .filter((r): r is RankingUser => r !== null)
}

// 智囊榜：基于用户在提问主题中被采纳为"最佳答案"的次数
async function getExpertRankings(
  limit: number,
  locale: string
): Promise<RankingUser[]> {
  const acceptances = await prisma.question_acceptances.findMany({
    select: {
      post: {
        select: {
          user_id: true,
          is_deleted: true,
        },
      },
    },
  })

  const acceptanceMap = new Map<string, number>()
  acceptances.forEach((a) => {
    if (!a.post.is_deleted) {
      const userId = String(a.post.user_id)
      acceptanceMap.set(userId, (acceptanceMap.get(userId) || 0) + 1)
    }
  })

  const sortedAcceptances = Array.from(acceptanceMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)

  if (sortedAcceptances.length === 0) {
    return []
  }

  const userIds = sortedAcceptances.map(([userId]) => BigInt(userId))

  const users = await prisma.users.findMany({
    where: {
      id: { in: userIds },
      is_deleted: false,
    },
    select: {
      id: true,
      name: true,
      avatar: true,
    },
  })

  const userMap = new Map(users.map((u) => [String(u.id), u]))
  const userBadges = await getUserBadges(userIds, locale)

  return sortedAcceptances
    .map(([userId, count], index) => {
      const user = userMap.get(userId)
      if (!user) return null
      return {
        rank: index + 1,
        user: {
          id: userId,
          name: user.name,
          avatar: user.avatar,
        },
        value: count,
        badges: userBadges.get(userId) || [],
      }
    })
    .filter((r): r is RankingUser => r !== null)
}

// 声望榜：基于用户发布的所有帖子收到的点赞总数 + 收藏总数
async function getReputationRankings(
  limit: number,
  locale: string
): Promise<RankingUser[]> {
  // 获取点赞统计
  const likes = await prisma.post_likes.groupBy({
    by: ["post_id"],
    _count: {
      post_id: true,
    },
  })

  const likesMap = new Map<string, number>()
  likes.forEach((l) => {
    likesMap.set(String(l.post_id), l._count.post_id)
  })

  // 获取收藏统计
  const bookmarks = await prisma.post_bookmarks.groupBy({
    by: ["post_id"],
    _count: {
      post_id: true,
    },
  })

  const bookmarksMap = new Map<string, number>()
  bookmarks.forEach((b) => {
    bookmarksMap.set(String(b.post_id), b._count.post_id)
  })

  // 获取所有帖子及其作者
  const posts = await prisma.posts.findMany({
    where: {
      is_deleted: false,
    },
    select: {
      id: true,
      user_id: true,
    },
  })

  // 按用户统计声望值
  const reputationMap = new Map<string, number>()
  posts.forEach((post) => {
    const postId = String(post.id)
    const userId = String(post.user_id)
    const likesCount = likesMap.get(postId) || 0
    const bookmarksCount = bookmarksMap.get(postId) || 0
    const reputation = likesCount + bookmarksCount
    reputationMap.set(userId, (reputationMap.get(userId) || 0) + reputation)
  })

  const sortedReputations = Array.from(reputationMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)

  if (sortedReputations.length === 0) {
    return []
  }

  const userIds = sortedReputations.map(([userId]) => BigInt(userId))

  const users = await prisma.users.findMany({
    where: {
      id: { in: userIds },
      is_deleted: false,
    },
    select: {
      id: true,
      name: true,
      avatar: true,
    },
  })

  const userMap = new Map(users.map((u) => [String(u.id), u]))
  const userBadges = await getUserBadges(userIds, locale)

  return sortedReputations
    .map(([userId, reputation], index) => {
      const user = userMap.get(userId)
      if (!user) return null
      return {
        rank: index + 1,
        user: {
          id: userId,
          name: user.name,
          avatar: user.avatar,
        },
        value: reputation,
        badges: userBadges.get(userId) || [],
      }
    })
    .filter((r): r is RankingUser => r !== null)
}

// 获取用户徽章（最多3个，按等级和获得时间排序）
async function getUserBadges(userIds: bigint[], locale: string) {
  const userBadges = await prisma.user_badges.findMany({
    where: {
      user_id: { in: userIds },
      is_deleted: false,
      badge: {
        is_visible: true,
        is_enabled: true,
        is_deleted: false,
      },
    },
    include: {
      badge: {
        select: {
          id: true,
          icon: true,
          level: true,
          bg_color: true,
          text_color: true,
          translations: getTranslationsQuery(locale, {
            name: true,
          }),
        },
      },
    },
    orderBy: [{ badge: { level: "desc" } }, { awarded_at: "desc" }],
  })

  const badgesMap = new Map<
    string,
    {
      id: string
      name: string
      icon: string
      level: number
      bgColor: string | null
      textColor: string | null
    }[]
  >()

  userBadges.forEach((ub) => {
    const userId = String(ub.user_id)
    if (!badgesMap.has(userId)) {
      badgesMap.set(userId, [])
    }
    const badges = badgesMap.get(userId)!
    if (badges.length < 3) {
      const badgeFields = getTranslationFields(
        ub.badge.translations as unknown as BadgeTranslation[],
        locale,
        {
          name: "",
        }
      )
      badges.push({
        id: String(ub.badge.id),
        name: badgeFields.name,
        icon: ub.badge.icon,
        level: ub.badge.level,
        bgColor: ub.badge.bg_color,
        textColor: ub.badge.text_color,
      })
    }
  })

  return badgesMap
}
