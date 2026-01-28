import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSessionUser } from "@/lib/server-auth"
import { getLocale } from "next-intl/server"
import { getTranslationsQuery, getTranslationField } from "@/lib/locale"
import { getTopicTitle } from "@/lib/topic-translation"

type TopicListItem = {
  id: string
  title: string
  type: string
  author: {
    id: string
    name: string
    avatar: string
  }
  category: {
    id: string
    name: string
    icon: string
    bgColor: string | null
    textColor: string | null
  }
  tags: Array<{
    id: string
    name: string
    icon: string
    bgColor: string | null
    textColor: string | null
  }>
  replies: number
  views: number
  isPinned: boolean
  isCommunity: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  lastActivityAt: string
}

type TopicListResult = {
  items: TopicListItem[]
  page: number
  pageSize: number
  total: number
}

// GET - 获取主题列表
export async function GET(request: NextRequest) {
  try {
    const locale = await getLocale()
    const auth = await getServerSessionUser()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = Math.min(
      parseInt(searchParams.get("pageSize") || "20"),
      100
    )
    const q = searchParams.get("q") || ""
    const categoryId = searchParams.get("categoryId")
    const tagId = searchParams.get("tagId")
    const isPinned = searchParams.get("isPinned")
    const isCommunity = searchParams.get("isCommunity")
    const isDeleted = searchParams.get("isDeleted")
    const sortBy = searchParams.get("sortBy") || "created_at"
    const order = searchParams.get("order") || "desc"

    // 构建查询条件
    const where: {
      translations?: {
        some: { title: { contains: string; mode: "insensitive" } }
      }
      category_id?: bigint
      is_pinned?: boolean
      is_community?: boolean
      is_deleted?: boolean
      tag_links?: { some: { tag_id: bigint } }
    } = {}

    if (q.trim().length > 0) {
      where.translations = {
        some: { title: { contains: q.trim(), mode: "insensitive" } },
      }
    }

    if (categoryId) {
      try {
        where.category_id = BigInt(categoryId)
      } catch {
        return NextResponse.json(
          { error: "Invalid categoryId" },
          { status: 400 }
        )
      }
    }

    if (tagId) {
      try {
        where.tag_links = { some: { tag_id: BigInt(tagId) } }
      } catch {
        return NextResponse.json({ error: "Invalid tagId" }, { status: 400 })
      }
    }

    if (isPinned === "true") {
      where.is_pinned = true
    } else if (isPinned === "false") {
      where.is_pinned = false
    }

    if (isCommunity === "true") {
      where.is_community = true
    } else if (isCommunity === "false") {
      where.is_community = false
    }

    if (isDeleted === "true") {
      where.is_deleted = true
    } else if (isDeleted === "false") {
      where.is_deleted = false
    }

    // 排序规则
    let orderBy:
      | { created_at?: "asc" | "desc" }
      | { updated_at?: "asc" | "desc" }
      | { views?: "asc" | "desc" }
      | { id: "desc" }
    if (sortBy === "created_at") {
      orderBy = { created_at: order === "asc" ? "asc" : "desc" }
    } else if (sortBy === "updated_at") {
      orderBy = { updated_at: order === "asc" ? "asc" : "desc" }
    } else if (sortBy === "views") {
      orderBy = { views: order === "asc" ? "asc" : "desc" }
    } else {
      orderBy = { id: "desc" }
    }

    // 查询总数
    const total = await prisma.topics.count({ where })

    // 查询当前页数据
    const topics = await prisma.topics.findMany({
      where,
      select: {
        id: true,
        translations: getTranslationsQuery(locale, { title: true }),
        type: true,
        views: true,
        is_pinned: true,
        is_community: true,
        is_deleted: true,
        created_at: true,
        updated_at: true,
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            icon: true,
            bg_color: true,
            text_color: true,
            translations: getTranslationsQuery(locale, { name: true }),
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
                translations: getTranslationsQuery(locale, { name: true }),
              },
            },
          },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    // 获取主题ID列表
    const topicIds = topics.map((t) => t.id)

    // 查询回复数和最后活跃时间
    const postsStats = await prisma.posts.groupBy({
      by: ["topic_id"],
      where: {
        topic_id: { in: topicIds },
      },
      _count: {
        id: true,
      },
      _max: {
        created_at: true,
      },
    })

    // 构建统计映射
    const statsMap = new Map<
      string,
      { count: number; lastActivity: Date | null }
    >()
    for (const stat of postsStats) {
      statsMap.set(String(stat.topic_id), {
        count: stat._count.id,
        lastActivity: stat._max.created_at,
      })
    }

    // 转换为 DTO
    const items: TopicListItem[] = topics.map((topic) => {
      const stats = statsMap.get(String(topic.id)) || {
        count: 0,
        lastActivity: null,
      }
      const replies = Math.max(stats.count - 1, 0) // 减去首帖

      return {
        id: String(topic.id),
        title: getTopicTitle(topic.translations, locale),
        type: topic.type || "GENERAL",
        author: {
          id: String(topic.user.id),
          name: topic.user.name,
          avatar: topic.user.avatar,
        },
        category: {
          id: String(topic.category.id),
          name: getTranslationField(
            topic.category.translations,
            locale,
            "name",
            ""
          ),
          icon: topic.category.icon,
          bgColor: topic.category.bg_color,
          textColor: topic.category.text_color,
        },
        tags: topic.tag_links.map((link) => ({
          id: String(link.tag.id),
          name: getTranslationField(link.tag.translations, locale, "name", ""),
          icon: link.tag.icon,
          bgColor: link.tag.bg_color,
          textColor: link.tag.text_color,
        })),
        replies,
        views: topic.views,
        isPinned: topic.is_pinned,
        isCommunity: topic.is_community,
        isDeleted: topic.is_deleted,
        createdAt: topic.created_at.toISOString(),
        updatedAt: topic.updated_at.toISOString(),
        lastActivityAt:
          stats.lastActivity?.toISOString() || topic.created_at.toISOString(),
      }
    })

    // 如果按回复数排序，在内存中排序
    if (sortBy === "replies") {
      items.sort((a, b) => {
        return order === "asc" ? a.replies - b.replies : b.replies - a.replies
      })
    }

    const result: TopicListResult = {
      items,
      page,
      pageSize,
      total,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Get topics error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
