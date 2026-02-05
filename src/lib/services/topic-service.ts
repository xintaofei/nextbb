import { prisma } from "@/lib/prisma"
import { getTranslationsQuery, getTranslationFields } from "@/lib/locale"
import { getTopicTitle, getPostHtml } from "@/lib/topic-translation"

/**
 * 话题列表项类型
 */
export type TopicListItem = {
  id: string
  title: string
  type: string
  category: {
    id: string
    name: string
    icon?: string
    description?: string | null
    bgColor?: string | null
    textColor?: string | null
  }
  tags: {
    id: string
    name: string
    icon: string
    description?: string | null
    bgColor?: string | null
    textColor?: string | null
  }[]
  author: {
    id: string
    name: string
    avatar: string
  }
  replies: number
  views: number
  activity: string
  isPinned: boolean
  isCommunity: boolean
  firstPost?: {
    id: string
    content: string
    createdAt: string
  }
}

/**
 * 话题列表查询结果
 */
export type TopicListResult = {
  items: TopicListItem[]
  page: number
  pageSize: number
  total: number
}

/**
 * 话题列表查询参数
 */
export type TopicListParams = {
  categoryId?: string
  tagId?: string
  sort?: "latest" | "new"
  filter?: "community" | "my"
  userId?: bigint // 用于 filter: "my"
}

/**
 * 获取话题列表
 *
 * 共享服务函数，供 API 路由和服务端组件使用
 */
export async function getTopicList(
  params: TopicListParams,
  page: number,
  pageSize: number,
  locale: string
): Promise<TopicListResult> {
  // 构建 where 条件
  const where: {
    is_deleted: boolean
    category_id?: bigint
    tag_links?: { some: { tag_id: bigint } }
    is_community?: boolean
    user_id?: bigint
  } = {
    is_deleted: false,
    ...(params.categoryId
      ? { category_id: BigInt(params.categoryId) }
      : undefined),
    ...(params.tagId
      ? { tag_links: { some: { tag_id: BigInt(params.tagId) } } }
      : undefined),
  }

  // 处理过滤参数
  if (params.filter === "community") {
    where.is_community = true
  } else if (params.filter === "my" && params.userId) {
    where.user_id = params.userId
  }

  const sortMode = params.sort ?? "latest"
  const skip = (page - 1) * pageSize

  // 并行查询总数和列表数据
  const [total, topics] = await Promise.all([
    prisma.topics.count({ where }),
    prisma.topics.findMany({
      where,
      select: {
        id: true,
        translations: getTranslationsQuery(locale, { title: true }),
        type: true,
        views: true,
        is_pinned: true,
        is_community: true,
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
        _count: {
          select: {
            posts: true,
          },
        },
      },
      skip,
      take: pageSize,
      orderBy:
        sortMode === "latest"
          ? [{ is_pinned: "desc" }, { updated_at: "desc" }, { id: "desc" }]
          : { id: "desc" },
    }),
  ])

  // 类型定义
  type TopicRow = {
    id: bigint
    translations: {
      locale: string
      title: string
      is_source: boolean
    }[]
    type: string
    views: number
    is_pinned: boolean
    is_community: boolean
    user: {
      id: bigint
      name: string
      avatar: string
    }
    category: {
      id: bigint
      icon: string
      bg_color: string | null
      text_color: string | null
      translations: {
        locale: string
        name: string
        description: string | null
        is_source: boolean
      }[]
    }
    tag_links: {
      tag: {
        id: bigint
        icon: string
        bg_color: string | null
        text_color: string | null
        translations: {
          locale: string
          name: string
          description: string | null
          is_source: boolean
        }[]
      }
    }[]
    _count: {
      posts: number
    }
    updated_at: Date
  }
  const topicsX = topics as unknown as TopicRow[]

  // 查询所有置顶话题的第一个 post（楼主 post），用于渲染三行预览
  const firstPosts: Record<
    string,
    { id: bigint; content: string; created_at: Date }
  > = {}
  const pinnedTopicIds = topicsX.filter((t) => t.is_pinned).map((t) => t.id)
  if (pinnedTopicIds.length > 0) {
    const firstPostsData = await prisma.posts.findMany({
      where: {
        topic_id: { in: pinnedTopicIds },
        floor_number: 0,
        is_deleted: false,
      },
      select: {
        id: true,
        topic_id: true,
        content: true,
        created_at: true,
        translations: getTranslationsQuery(locale, { content_html: true }),
      },
    })
    for (const post of firstPostsData) {
      // 优先使用当前语言的翻译，如果不存在则回退到 content (原内容)
      const translatedContent = getPostHtml(
        post.translations as unknown as Parameters<typeof getPostHtml>[0],
        locale
      )
      firstPosts[String(post.topic_id)] = {
        id: post.id,
        content: translatedContent || post.content,
        created_at: post.created_at,
      }
    }
  }

  // 转换数据格式
  const items: TopicListItem[] = topicsX.map((t) => {
    // 使用通用工具函数获取翻译字段
    const categoryFields = getTranslationFields(
      t.category.translations,
      locale,
      {
        name: "",
        description: null as string | null,
      }
    )
    const tags = t.tag_links.map(
      (l: {
        tag: {
          id: bigint
          icon: string
          bg_color: string | null
          text_color: string | null
          translations: {
            locale: string
            name: string
            description: string | null
            is_source: boolean
          }[]
        }
      }) => {
        const tagFields = getTranslationFields(l.tag.translations, locale, {
          name: "",
          description: null as string | null,
        })
        return {
          id: String(l.tag.id),
          name: tagFields.name,
          icon: l.tag.icon,
          description: tagFields.description,
          bgColor: l.tag.bg_color,
          textColor: l.tag.text_color,
        }
      }
    )
    const firstPost = firstPosts[String(t.id)]
    const lastActive = t.updated_at

    return {
      id: String(t.id),
      title: getTopicTitle(t.translations, locale),
      type: t.type || "GENERAL",
      category: {
        id: String(t.category.id),
        name: categoryFields.name,
        icon: t.category.icon ?? undefined,
        description: categoryFields.description ?? undefined,
        bgColor: t.category.bg_color,
        textColor: t.category.text_color,
      },
      tags,
      author: {
        id: String(t.user.id),
        name: t.user.name,
        avatar: t.user.avatar,
      },
      replies: Math.max(t._count.posts - 1, 0),
      views: t.views ?? 0,
      activity: lastActive ? lastActive.toISOString() : "",
      isPinned: Boolean(t.is_pinned),
      isCommunity: Boolean(t.is_community),
      ...(firstPost && {
        firstPost: {
          id: String(firstPost.id),
          content: firstPost.content,
          createdAt: firstPost.created_at.toISOString(),
        },
      }),
    }
  })

  return {
    items,
    page,
    pageSize,
    total,
  }
}
