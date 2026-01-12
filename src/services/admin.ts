import { prisma } from "@/lib/prisma"

export interface DashboardOverview {
  users: number
  topics: number
  posts: number
  interactions: number
}

export interface DashboardTrends {
  userGrowth: { date: string; name: string; value: number }[]
  contentGrowth: { date: string; name: string; value: number }[]
}

export interface DashboardTaxonomy {
  categories: { id: string; name: string; count: number }[]
  tags: { id: string; name: string; count: number }[]
  badges: {
    total: number
    awarded: number
    topBadges: { id: string; name: string; count: number }[]
  }
}

export interface DashboardActivity {
  activeUsers7d: number
  checkins7d: number
  topActiveUsers: {
    id: string
    name: string
    avatar: string
    postCount: number
  }[]
}

export async function getOverviewStats(): Promise<DashboardOverview> {
  const [users, topics, posts, likes, bookmarks] = await Promise.all([
    prisma.users.count({ where: { is_deleted: false } }),
    prisma.topics.count({ where: { is_deleted: false } }),
    prisma.posts.count({ where: { is_deleted: false } }),
    prisma.post_likes.count(),
    prisma.post_bookmarks.count(),
  ])

  return {
    users,
    topics,
    posts,
    interactions: likes + bookmarks,
  }
}

export async function getTrendStats(): Promise<DashboardTrends> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [userGrowthRaw, topicGrowthRaw, postGrowthRaw] = await Promise.all([
    prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM users
      WHERE created_at >= ${thirtyDaysAgo} AND is_deleted = false
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
    prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM topics
      WHERE created_at >= ${thirtyDaysAgo} AND is_deleted = false
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
    prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM posts
      WHERE created_at >= ${thirtyDaysAgo} AND is_deleted = false
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
  ])

  const fillDates = (data: { date: Date; count: bigint }[]) => {
    const result = []
    const map = new Map(
      data.map((item) => [
        item.date instanceof Date
          ? item.date.toISOString().split("T")[0]
          : new Date(item.date).toISOString().split("T")[0],
        Number(item.count),
      ])
    )

    for (let i = 0; i < 30; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (29 - i))
      const dateStr = d.toISOString().split("T")[0]
      result.push({
        date: dateStr,
        name: dateStr.slice(5),
        value: map.get(dateStr) || 0,
      })
    }
    return result
  }

  const userGrowth = fillDates(userGrowthRaw)
  const topicMap = new Map(
    topicGrowthRaw.map((i) => [
      new Date(i.date).toISOString().split("T")[0],
      Number(i.count),
    ])
  )
  const postMap = new Map(
    postGrowthRaw.map((i) => [
      new Date(i.date).toISOString().split("T")[0],
      Number(i.count),
    ])
  )

  const contentGrowth = []
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    const dateStr = d.toISOString().split("T")[0]
    contentGrowth.push({
      date: dateStr,
      name: dateStr.slice(5),
      value: (topicMap.get(dateStr) || 0) + (postMap.get(dateStr) || 0),
    })
  }

  return { userGrowth, contentGrowth }
}

export async function getTaxonomyStats(): Promise<DashboardTaxonomy> {
  const [
    categoriesRaw,
    tagsRaw,
    badgesCount,
    awardedBadgesCount,
    topBadgesRaw,
    categoryTranslations,
    tagTranslations,
    badgeTranslations,
  ] = await Promise.all([
    prisma.topics.groupBy({
      by: ["category_id"],
      _count: { category_id: true },
      orderBy: { _count: { category_id: "desc" } },
      take: 5,
    }),
    prisma.topic_tags.groupBy({
      by: ["tag_id"],
      _count: { tag_id: true },
      orderBy: { _count: { tag_id: "desc" } },
      take: 6,
    }),
    prisma.badges.count({ where: { is_deleted: false } }),
    prisma.user_badges.count({ where: { is_deleted: false } }),
    prisma.user_badges.groupBy({
      by: ["badge_id"],
      _count: { badge_id: true },
      orderBy: { _count: { badge_id: "desc" } },
      take: 5,
    }),
    prisma.category_translations.findMany({
      where: { locale: "zh" },
      select: { category_id: true, name: true },
    }),
    prisma.tag_translations.findMany({
      where: { locale: "zh" },
      select: { tag_id: true, name: true },
    }),
    prisma.badge_translations.findMany({
      where: { locale: "zh" },
      select: { badge_id: true, name: true },
    }),
  ])

  const categories = categoriesRaw.map((c) => ({
    id: c.category_id.toString(),
    name:
      categoryTranslations.find((t) => t.category_id === c.category_id)?.name ||
      `Cat-${c.category_id}`,
    count: c._count.category_id,
  }))

  const tags = tagsRaw.map((t) => ({
    id: t.tag_id.toString(),
    name:
      tagTranslations.find((tr) => tr.tag_id === t.tag_id)?.name ||
      `Tag-${t.tag_id}`,
    count: t._count.tag_id,
  }))

  const topBadges = topBadgesRaw.map((b) => ({
    id: b.badge_id.toString(),
    name:
      badgeTranslations.find((t) => t.badge_id === b.badge_id)?.name ||
      `Badge-${b.badge_id}`,
    count: b._count.badge_id,
  }))

  return {
    categories,
    tags,
    badges: {
      total: badgesCount,
      awarded: awardedBadgesCount,
      topBadges,
    },
  }
}

export async function getActivityStats(): Promise<DashboardActivity> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [checkins7d, activePosters, activeCheckiners, topActiveUsersRaw] =
    await Promise.all([
      prisma.user_checkins.count({
        where: { created_at: { gte: sevenDaysAgo } },
      }),
      prisma.posts.findMany({
        where: { created_at: { gte: sevenDaysAgo }, is_deleted: false },
        select: { user_id: true },
        distinct: ["user_id"],
      }),
      prisma.user_checkins.findMany({
        where: { created_at: { gte: sevenDaysAgo } },
        select: { user_id: true },
        distinct: ["user_id"],
      }),
      prisma.posts.groupBy({
        by: ["user_id"],
        _count: { user_id: true },
        where: { created_at: { gte: sevenDaysAgo }, is_deleted: false },
        orderBy: { _count: { user_id: "desc" } },
        take: 5,
      }),
    ])

  const activeUserIds = new Set([
    ...activePosters.map((p) => p.user_id.toString()),
    ...activeCheckiners.map((c) => c.user_id.toString()),
  ])

  const userIds = topActiveUsersRaw.map((u) => u.user_id)
  const userDetails = await prisma.users.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, avatar: true },
  })

  const topActiveUsers = topActiveUsersRaw.map((u) => {
    const details = userDetails.find((d) => d.id === u.user_id)
    return {
      id: u.user_id.toString(),
      name: details?.name || "Unknown",
      avatar: details?.avatar || "",
      postCount: u._count.user_id,
    }
  })

  return {
    activeUsers7d: activeUserIds.size,
    checkins7d,
    topActiveUsers,
  }
}
