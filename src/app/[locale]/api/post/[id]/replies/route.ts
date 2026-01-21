import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import { getLocale } from "next-intl/server"
import {
  getTranslationsQuery,
  getTranslationFields,
  BadgeTranslation,
} from "@/lib/locale"
import { BadgeItem } from "@/types/topic"
import { getPostHtmlWithLocale, PostTranslation } from "@/lib/topic-translation"

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const locale = await getLocale()
  const auth = await getSessionUser()
  const { id: idStr } = await ctx.params
  let parentId: bigint
  try {
    parentId = BigInt(idStr)
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const postsDb = await prisma.posts.findMany({
    where: { parent_id: parentId, is_deleted: false },
    select: {
      id: true,
      content: true,
      translations: getTranslationsQuery(locale, { content_html: true }),
      created_at: true,
      is_deleted: true,
      parent_id: true,
      user: {
        select: { id: true, name: true, avatar: true, title_badge_id: true },
      },
    },
    orderBy: { created_at: "asc" },
  })

  if (postsDb.length === 0) {
    return NextResponse.json({ items: [] })
  }

  const postIds = postsDb.map((p) => p.id)
  const userIds = [...new Set(postsDb.map((p) => p.user.id))]

  // 获取用户头衔徽章映射
  const userTitleBadgeMap = new Map<string, string>()
  for (const p of postsDb) {
    if (p.user.title_badge_id) {
      userTitleBadgeMap.set(String(p.user.id), String(p.user.title_badge_id))
    }
  }

  // 并行查询所有关联数据
  const [userBadges, likeCounts, bookmarkCounts, likedRows, bookmarkedRows] =
    await Promise.all([
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

      // 4. 获取当前用户点赞状态
      auth && postIds.length > 0
        ? prisma.post_likes.findMany({
            select: { post_id: true },
            where: { post_id: { in: postIds }, user_id: auth.userId },
          })
        : Promise.resolve([]),

      // 5. 获取当前用户收藏状态
      auth && postIds.length > 0
        ? prisma.post_bookmarks.findMany({
            select: { post_id: true },
            where: { post_id: { in: postIds }, user_id: auth.userId },
          })
        : Promise.resolve([]),
    ])

  // 处理徽章数据
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

  const likedSet = new Set<string>()
  for (const r of likedRows) likedSet.add(String(r.post_id))

  const bookmarkedSet = new Set<string>()
  for (const r of bookmarkedRows) bookmarkedSet.add(String(r.post_id))

  const items = postsDb.map((p) => {
    const idStr = String(p.id)
    const userId = String(p.user.id)
    const { contentHtml, contentLocale } = getPostHtmlWithLocale(
      p.translations as PostTranslation[],
      locale
    )
    return {
      id: idStr,
      author: {
        id: userId,
        name: p.user.name,
        avatar: p.user.avatar,
      },
      content: p.content,
      contentHtml: contentHtml || undefined,
      contentLocale,
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
      replyCount: 0, // Nested sub-replies are not supported for now to avoid complexity
      parentId: String(p.parent_id),
    }
  })

  return NextResponse.json({ items })
}
