import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import { getLocale } from "next-intl/server"
import {
  getTranslationsQuery,
  getTranslationFields,
  BadgeTranslation,
} from "@/lib/locale"
import { getPostHtml } from "@/lib/topic-translation"

type Author = {
  id: string
  name: string
  avatar: string
}

type BadgeItem = {
  id: string
  name: string
  icon: string
  level: number
  bgColor: string | null
  textColor: string | null
  description: string | null
}

type PostItem = {
  id: string
  author: Author
  content: string
  contentHtml?: string
  createdAt: string
  minutesAgo: number
  isDeleted: boolean
  likes: number
  liked: boolean
  bookmarks: number
  bookmarked: boolean
  badges?: BadgeItem[]
  bountyReward?: {
    amount: number
    createdAt: string
  } | null
  questionAcceptance?: {
    acceptedBy: {
      id: string
      name: string
      avatar: string
    }
    acceptedAt: string
  } | null
  lotteryWin?: {
    wonAt: string
  } | null
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
  const locale = await getLocale()
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
      translations: getTranslationsQuery(locale, { content_html: true }),
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
    translations: {
      locale: string
      content_html: string
      is_source: boolean
    }[]
    created_at: Date
    is_deleted: boolean
    user: { id: bigint; name: string; avatar: string }
  }
  const postIds = postsDb.map((p: PostRow) => p.id)

  // 获取用户 ID 列表
  const userIds = [...new Set(postsDb.map((p: PostRow) => p.user.id))]

  // 获取用户徽章
  const userBadgesMap = new Map<string, BadgeItem[]>()
  if (userIds.length > 0) {
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
              description: true,
            }),
          },
        },
      },
      orderBy: [{ badge: { level: "desc" } }, { awarded_at: "desc" }],
    })

    for (const ub of userBadges) {
      const userId = String(ub.user_id)
      if (!userBadgesMap.has(userId)) {
        userBadgesMap.set(userId, [])
      }
      const badgeFields = getTranslationFields(
        ub.badge.translations as unknown as BadgeTranslation[],
        locale,
        {
          name: "",
          description: null as string | null,
        }
      )
      userBadgesMap.get(userId)!.push({
        id: String(ub.badge.id),
        name: badgeFields.name,
        icon: ub.badge.icon,
        level: ub.badge.level,
        bgColor: ub.badge.bg_color,
        textColor: ub.badge.text_color,
        description: badgeFields.description,
      })
    }
  }

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

  // 查询悬赏奖励记录
  const bountyRewardsMap = new Map<
    string,
    { amount: number; createdAt: string }
  >()
  if (postIds.length > 0) {
    const bountyRewards = await prisma.bounty_rewards.findMany({
      where: { post_id: { in: postIds } },
      select: {
        post_id: true,
        amount: true,
        created_at: true,
      },
    })
    for (const reward of bountyRewards) {
      bountyRewardsMap.set(String(reward.post_id), {
        amount: reward.amount,
        createdAt: reward.created_at.toISOString(),
      })
    }
  }

  // 查询采纳记录
  const questionAcceptancesMap = new Map<
    string,
    {
      acceptedBy: { id: string; name: string; avatar: string }
      acceptedAt: string
    }
  >()
  if (postIds.length > 0) {
    const questionAcceptances = await prisma.question_acceptances.findMany({
      where: { post_id: { in: postIds } },
      select: {
        post_id: true,
        accepted_at: true,
        accepter: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })
    for (const acceptance of questionAcceptances) {
      questionAcceptancesMap.set(String(acceptance.post_id), {
        acceptedBy: {
          id: String(acceptance.accepter.id),
          name: acceptance.accepter.name,
          avatar: acceptance.accepter.avatar,
        },
        acceptedAt: acceptance.accepted_at.toISOString(),
      })
    }
  }

  // 查询抽奖中奖记录
  const lotteryWinnersMap = new Map<string, { wonAt: string }>()
  if (postIds.length > 0) {
    const lotteryWinners = await prisma.lottery_winners.findMany({
      where: { post_id: { in: postIds } },
      select: {
        post_id: true,
        won_at: true,
      },
    })
    for (const winner of lotteryWinners) {
      lotteryWinnersMap.set(String(winner.post_id), {
        wonAt: winner.won_at.toISOString(),
      })
    }
  }

  const items: PostItem[] = postsDb.map((p: PostRow) => {
    const idStr = String(p.id)
    const userId = String(p.user.id)
    return {
      id: idStr,
      author: {
        id: userId,
        name: p.user.name,
        avatar: p.user.avatar,
      },
      content: p.content,
      contentHtml: getPostHtml(p.translations, locale) || undefined,
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
      badges: userBadgesMap.get(userId) ?? [],
      bountyReward: bountyRewardsMap.get(idStr) ?? null,
      questionAcceptance: questionAcceptancesMap.get(idStr) ?? null,
      lotteryWin: lotteryWinnersMap.get(idStr) ?? null,
    }
  })

  const hasMore = skip + items.length < total
  const result: PostPage = { items, page, pageSize, total, hasMore }
  return NextResponse.json(result)
}
