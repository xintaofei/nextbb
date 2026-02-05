import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import {
  BadgeTranslation,
  getTranslationFields,
  getTranslationsQuery,
} from "@/lib/locale"
import { getPostHtmlWithLocale, getTopicTitle } from "@/lib/topic-translation"
import {
  BadgeItem,
  PostItem,
  PostPage,
  TopicInfo as TopicInfoType,
} from "@/types/topic"
import { ServerSessionUser } from "@/lib/server-auth"

export const getTopicInfo = cache(async function getTopicInfo(
  topicId: bigint,
  locale: string
): Promise<TopicInfoType | null> {
  const topic = await prisma.topics.findFirst({
    where: { id: topicId, is_deleted: false },
    select: {
      id: true,
      views: true,
      translations: getTranslationsQuery(locale, { title: true }),
      type: true,
      status: true,
      is_pinned: true,
      is_community: true,
      end_time: true,
      is_settled: true,
      category: {
        select: {
          id: true,
          icon: true,
          bg_color: true,
          text_color: true,
          translations: getTranslationsQuery(locale, {
            name: true,
            description: true,
          }),
        },
      },
      tag_links: {
        select: {
          tag: {
            select: {
              id: true,
              icon: true,
              bg_color: true,
              text_color: true,
              translations: getTranslationsQuery(locale, {
                name: true,
                description: true,
              }),
            },
          },
        },
      },
    },
  })

  if (!topic) return null

  const [participants, participantCountData, lastPost] = await Promise.all([
    prisma.posts.findMany({
      where: { topic_id: topicId, is_deleted: false },
      select: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { created_at: "asc" },
      distinct: ["user_id"],
      take: 5,
    }),
    prisma.posts.groupBy({
      by: ["user_id"],
      where: { topic_id: topicId, is_deleted: false },
    }),
    prisma.posts.findFirst({
      where: { topic_id: topicId, is_deleted: false },
      orderBy: { created_at: "desc" },
      select: { created_at: true },
    }),
  ])

  const categoryFields = getTranslationFields(
    topic.category.translations,
    locale,
    { name: "", description: null }
  )

  return {
    id: String(topic.id),
    title: getTopicTitle(topic.translations, locale),
    type: topic.type || "GENERAL",
    isPinned: topic.is_pinned,
    isCommunity: topic.is_community ?? false,
    status: topic.status ?? undefined,
    endTime: topic.end_time ? topic.end_time.toISOString() : null,
    isSettled: topic.is_settled,
    category: {
      id: String(topic.category.id),
      name: categoryFields.name,
      icon: topic.category.icon ?? undefined,
      description: categoryFields.description,
      bgColor: topic.category.bg_color,
      textColor: topic.category.text_color,
    },
    tags: topic.tag_links.map((l) => {
      const tagFields = getTranslationFields(l.tag.translations, locale, {
        name: "",
        description: null,
      })
      return {
        id: String(l.tag.id),
        name: tagFields.name,
        icon: l.tag.icon,
        description: tagFields.description,
        bgColor: l.tag.bg_color,
        textColor: l.tag.text_color,
      }
    }),
    views: topic.views + 1,
    participantCount: participantCountData.length,
    participants: participants.map((p) => ({
      id: String(p.user.id),
      name: p.user.name,
      avatar: p.user.avatar,
    })),
    lastActiveTime: lastPost?.created_at.toISOString() ?? null,
  }
})

export async function incrementTopicViews(topicId: bigint): Promise<void> {
  await prisma.$executeRaw(
    Prisma.sql`UPDATE topics SET views = views + 1 WHERE id = ${topicId}`
  )
}

// 使用 cache 包装，确保在同一次请求中只执行一次
export const incrementTopicViewsOnce = cache(
  async (topicId: bigint): Promise<void> => {
    await incrementTopicViews(topicId)
  }
)

export const getTopicPosts = cache(async function getTopicPosts(
  topicId: bigint,
  locale: string,
  auth: ServerSessionUser | null,
  page: number = 1,
  pageSize: number = 15
): Promise<PostPage> {
  const normalizedPage = Math.max(page, 1)
  const normalizedPageSize = Math.max(pageSize, 1)
  const skip = (normalizedPage - 1) * normalizedPageSize

  // 并行查询总数和当前页数据
  const [total, postsDb] = await Promise.all([
    prisma.posts.count({
      where: { topic_id: topicId },
    }),
    prisma.posts.findMany({
      where: { topic_id: topicId },
      select: {
        id: true,
        floor_number: true,
        content: true,
        translations: getTranslationsQuery(locale, { content_html: true }),
        created_at: true,
        is_deleted: true,
        is_first_user_post: true,
        parent_id: true,
        source_locale: true,
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            title_badge_id: true,
            custom_status: {
              select: {
                emoji: true,
                status_text: true,
                expires_at: true,
                is_deleted: true,
              },
            },
          },
        },
      },
      orderBy: { floor_number: "asc" },
      skip,
      take: normalizedPageSize,
    }),
  ])

  const postIds = postsDb.map((p) => p.id)

  // 获取用户 ID 列表
  const userIds = [...new Set(postsDb.map((p) => p.user.id))]

  // 获取用户头衔徽章映射
  const userTitleBadgeMap = new Map<string, string>()
  for (const p of postsDb) {
    if (p.user.title_badge_id) {
      userTitleBadgeMap.set(String(p.user.id), String(p.user.title_badge_id))
    }
  }

  // 并行查询所有关联数据
  const [
    userBadges,
    likeCounts,
    bookmarkCounts,
    replyCounts,
    likedRows,
    bookmarkedRows,
    bountyRewards,
    questionAcceptances,
    lotteryWinners,
  ] = await Promise.all([
    // 1. 获取用户徽章
    userIds.length > 0
      ? prisma.user_badges.findMany({
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
      : Promise.resolve([]),

    // 2. 获取点赞数
    postIds.length > 0
      ? prisma.post_likes.groupBy({
          by: ["post_id"],
          _count: { post_id: true },
          where: { post_id: { in: postIds } },
        })
      : Promise.resolve([]),

    // 3. 获取收藏数
    postIds.length > 0
      ? prisma.post_bookmarks.groupBy({
          by: ["post_id"],
          _count: { post_id: true },
          where: { post_id: { in: postIds } },
        })
      : Promise.resolve([]),

    // 4. 获取回复数
    postIds.length > 0
      ? prisma.posts.groupBy({
          by: ["parent_id"],
          where: { parent_id: { in: postIds } },
          _count: { id: true },
        })
      : Promise.resolve([]),

    // 5. 获取当前用户点赞状态
    auth && postIds.length > 0
      ? prisma.post_likes.findMany({
          select: { post_id: true },
          where: { post_id: { in: postIds }, user_id: auth.userId },
        })
      : Promise.resolve([]),

    // 6. 获取当前用户收藏状态
    auth && postIds.length > 0
      ? prisma.post_bookmarks.findMany({
          select: { post_id: true },
          where: { post_id: { in: postIds }, user_id: auth.userId },
        })
      : Promise.resolve([]),

    // 7. 查询悬赏奖励记录
    postIds.length > 0
      ? prisma.bounty_rewards.findMany({
          where: { post_id: { in: postIds } },
          select: {
            post_id: true,
            amount: true,
            created_at: true,
          },
        })
      : Promise.resolve([]),

    // 8. 查询采纳记录
    postIds.length > 0
      ? prisma.question_acceptances.findMany({
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
      : Promise.resolve([]),

    // 9. 查询抽奖中奖记录
    postIds.length > 0
      ? prisma.lottery_winners.findMany({
          where: { post_id: { in: postIds } },
          select: {
            post_id: true,
            won_at: true,
          },
        })
      : Promise.resolve([]),
  ])

  // 处理用户徽章
  const userBadgesMap = new Map<string, BadgeItem[]>()
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

  // 根据头衔徽章调整顺序
  for (const [userId, badges] of userBadgesMap) {
    const titleBadgeId = userTitleBadgeMap.get(userId)
    if (titleBadgeId) {
      const index = badges.findIndex((b) => b.id === titleBadgeId)
      if (index > 0) {
        const [badge] = badges.splice(index, 1)
        badges.unshift(badge)
      }
    }
  }

  // 处理计数和状态
  const countsById = new Map<string, number>()
  for (const c of likeCounts) {
    countsById.set(String(c.post_id), c._count.post_id ?? 0)
  }

  const bookmarkCountsById = new Map<string, number>()
  for (const c of bookmarkCounts) {
    bookmarkCountsById.set(String(c.post_id), c._count.post_id ?? 0)
  }

  const replyCountsById = new Map<string, number>()
  for (const c of replyCounts) {
    replyCountsById.set(String(c.parent_id), c._count.id ?? 0)
  }

  const likedSet = new Set<string>()
  for (const r of likedRows) likedSet.add(String(r.post_id))

  const bookmarkedSet = new Set<string>()
  for (const r of bookmarkedRows) bookmarkedSet.add(String(r.post_id))

  // 处理特殊状态（悬赏、采纳、抽奖）
  const bountyRewardsMap = new Map<
    string,
    { amount: number; createdAt: string }
  >()
  for (const reward of bountyRewards) {
    bountyRewardsMap.set(String(reward.post_id), {
      amount: reward.amount,
      createdAt: reward.created_at.toISOString(),
    })
  }

  const questionAcceptancesMap = new Map<
    string,
    {
      acceptedBy: { id: string; name: string; avatar: string }
      acceptedAt: string
    }
  >()
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

  const lotteryWinnersMap = new Map<string, { wonAt: string }>()
  for (const winner of lotteryWinners) {
    lotteryWinnersMap.set(String(winner.post_id), {
      wonAt: winner.won_at.toISOString(),
    })
  }

  const items: PostItem[] = postsDb.map((p) => {
    const idStr = String(p.id)
    const userId = String(p.user.id)
    const { contentHtml, contentLocale } = getPostHtmlWithLocale(
      p.translations,
      locale
    )

    // 检查自定义状态是否过期或已删除
    const customStatus =
      p.user.custom_status &&
      !p.user.custom_status.is_deleted &&
      (!p.user.custom_status.expires_at ||
        p.user.custom_status.expires_at > new Date())
        ? {
            emoji: p.user.custom_status.emoji,
            statusText: p.user.custom_status.status_text,
          }
        : null

    return {
      id: idStr,
      floorNumber: p.floor_number,
      author: {
        id: userId,
        name: p.user.name,
        avatar: p.user.avatar,
        customStatus,
      },
      content: p.content,
      contentHtml: contentHtml || undefined,
      contentLocale: contentLocale || undefined,
      sourceLocale: p.source_locale,
      createdAt: p.created_at.toISOString(),
      minutesAgo: Math.max(
        Math.round((Date.now() - p.created_at.getTime()) / 60000),
        0
      ),
      isDeleted: p.is_deleted,
      isFirstUserPost: p.is_first_user_post,
      likes: countsById.get(idStr) ?? 0,
      liked: likedSet.has(idStr),
      bookmarks: bookmarkCountsById.get(idStr) ?? 0,
      bookmarked: bookmarkedSet.has(idStr),
      badges: userBadgesMap.get(userId) ?? [],
      bountyReward: bountyRewardsMap.get(idStr) ?? null,
      questionAcceptance: questionAcceptancesMap.get(idStr) ?? null,
      lotteryWin: lotteryWinnersMap.get(idStr) ?? null,
      replyCount: replyCountsById.get(idStr) ?? 0,
      parentId: p.parent_id > 0 ? String(p.parent_id) : null,
    }
  })

  const hasMore = skip + items.length < total
  return {
    items,
    page: normalizedPage,
    pageSize: normalizedPageSize,
    total,
    hasMore,
  }
})
