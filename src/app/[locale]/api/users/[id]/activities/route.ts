import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import { getLocale } from "next-intl/server"
import { getTranslationsQuery, getTranslationField } from "@/lib/locale"
import type {
  ActivityType,
  ActivityItem,
  ActivitiesResponse,
  CategoryInfo,
} from "@/types/activity"

type Params = Promise<{ id: string }>

// 辅助函数：移除HTML标签并截取文本
function stripHtmlAndTruncate(html: string, maxLength: number): string {
  const text = html.replace(/<[^>]*>/g, "").trim()
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength) + "..."
}

// 辅助函数：格式化分类信息
function formatCategoryInfo(
  category: {
    id: bigint
    icon: string
    bg_color: string | null
    text_color: string | null
    translations: {
      locale: string
      name: string
      is_source: boolean
    }[]
  },
  locale: string
): CategoryInfo {
  return {
    id: String(category.id),
    name: getTranslationField(category.translations, locale, "name", ""),
    icon: category.icon,
    bgColor: category.bg_color,
    textColor: category.text_color,
  }
}

// 查询主题类活动
async function getTopicsActivities(
  userId: bigint,
  limit: number,
  offset: number,
  locale: string
): Promise<ActivityItem[]> {
  const topics = await prisma.topics.findMany({
    where: {
      user_id: userId,
      is_deleted: false,
    },
    select: {
      id: true,
      title: true,
      type: true,
      views: true,
      created_at: true,
      category: {
        select: {
          id: true,
          icon: true,
          bg_color: true,
          text_color: true,
          translations: getTranslationsQuery(locale, {
            name: true,
          }),
        },
      },
      posts: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
    skip: offset,
    take: limit,
  })

  return topics.map((topic) => ({
    activityType: "topics" as ActivityType,
    activityTime: topic.created_at.toISOString(),
    topicData: {
      topicId: String(topic.id),
      title: topic.title,
      category: formatCategoryInfo(topic.category, locale),
      type: topic.type,
      views: topic.views,
      repliesCount: topic.posts.length,
    },
  }))
}

// 查询回复类活动
async function getPostsActivities(
  userId: bigint,
  limit: number,
  offset: number,
  locale: string
): Promise<ActivityItem[]> {
  const posts = await prisma.posts.findMany({
    where: {
      user_id: userId,
      is_deleted: false,
      floor_number: {
        gt: 1,
      },
    },
    select: {
      id: true,
      floor_number: true,
      content: true,
      created_at: true,
      topic: {
        select: {
          id: true,
          title: true,
          category: {
            select: {
              id: true,
              icon: true,
              bg_color: true,
              text_color: true,
              translations: getTranslationsQuery(locale, {
                name: true,
              }),
            },
          },
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
    skip: offset,
    take: limit,
  })

  // 获取每个帖子的点赞数
  const postIds = posts.map((p) => p.id)
  const likeCounts = await prisma.post_likes.groupBy({
    by: ["post_id"],
    where: {
      post_id: { in: postIds },
    },
    _count: {
      post_id: true,
    },
  })

  const likeCountMap = new Map<string, number>()
  likeCounts.forEach((lc) => {
    likeCountMap.set(String(lc.post_id), lc._count.post_id)
  })

  return posts.map((post) => ({
    activityType: "posts" as ActivityType,
    activityTime: post.created_at.toISOString(),
    postData: {
      postId: String(post.id),
      floorNumber: post.floor_number,
      contentPreview: stripHtmlAndTruncate(post.content, 150),
      topicId: String(post.topic.id),
      topicTitle: post.topic.title,
      category: formatCategoryInfo(post.topic.category, locale),
      likesCount: likeCountMap.get(String(post.id)) || 0,
    },
  }))
}

// 查询点赞类活动
async function getLikesActivities(
  userId: bigint,
  limit: number,
  offset: number,
  locale: string
): Promise<ActivityItem[]> {
  const likes = await prisma.post_likes.findMany({
    where: {
      user_id: userId,
      post: {
        is_deleted: false,
        topic: {
          is_deleted: false,
        },
      },
    },
    select: {
      created_at: true,
      post: {
        select: {
          id: true,
          floor_number: true,
          content: true,
          user_id: true,
          topic: {
            select: {
              id: true,
              title: true,
              category: {
                select: {
                  id: true,
                  icon: true,
                  bg_color: true,
                  text_color: true,
                  translations: getTranslationsQuery(locale, {
                    name: true,
                  }),
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
    skip: offset,
    take: limit,
  })

  return likes.map((like) => ({
    activityType: "likes" as ActivityType,
    activityTime: like.created_at.toISOString(),
    likeData: {
      postId: String(like.post.id),
      floorNumber: like.post.floor_number,
      contentPreview: stripHtmlAndTruncate(like.post.content, 150),
      topicId: String(like.post.topic.id),
      topicTitle: like.post.topic.title,
      category: formatCategoryInfo(like.post.topic.category, locale),
      author: {
        id: String(like.post.user.id),
        name: like.post.user.name,
        avatar: like.post.user.avatar,
      },
    },
  }))
}

// 查询收藏类活动
async function getBookmarksActivities(
  userId: bigint,
  limit: number,
  offset: number,
  locale: string
): Promise<ActivityItem[]> {
  const bookmarks = await prisma.post_bookmarks.findMany({
    where: {
      user_id: userId,
      post: {
        is_deleted: false,
        topic: {
          is_deleted: false,
        },
      },
    },
    select: {
      created_at: true,
      post: {
        select: {
          id: true,
          floor_number: true,
          content: true,
          user_id: true,
          topic: {
            select: {
              id: true,
              title: true,
              category: {
                select: {
                  id: true,
                  icon: true,
                  bg_color: true,
                  text_color: true,
                  translations: getTranslationsQuery(locale, {
                    name: true,
                  }),
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
    skip: offset,
    take: limit,
  })

  return bookmarks.map((bookmark) => ({
    activityType: "bookmarks" as ActivityType,
    activityTime: bookmark.created_at.toISOString(),
    bookmarkData: {
      postId: String(bookmark.post.id),
      floorNumber: bookmark.post.floor_number,
      contentPreview: stripHtmlAndTruncate(bookmark.post.content, 150),
      topicId: String(bookmark.post.topic.id),
      topicTitle: bookmark.post.topic.title,
      category: formatCategoryInfo(bookmark.post.topic.category, locale),
      author: {
        id: String(bookmark.post.user.id),
        name: bookmark.post.user.name,
        avatar: bookmark.post.user.avatar,
      },
    },
  }))
}

export async function GET(req: Request, props: { params: Params }) {
  try {
    const params = await props.params
    const { id: idStr } = params

    // 解析用户ID
    let userId: bigint
    try {
      userId = BigInt(idStr)
    } catch {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    // 验证用户是否存在
    const user = await prisma.users.findFirst({
      where: { id: userId, is_deleted: false },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // 获取当前语言
    const locale = await getLocale()

    // 解析查询参数
    const url = new URL(req.url)
    const type = (url.searchParams.get("type") || "all") as ActivityType
    const page = Math.max(Number(url.searchParams.get("page") || "1"), 1)
    const pageSize = Math.min(
      Math.max(Number(url.searchParams.get("pageSize") || "20"), 1),
      50
    )

    // 权限验证：likes和bookmarks需要本人或管理员
    if (type === "likes" || type === "bookmarks") {
      const session = await getSessionUser()
      if (!session) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        )
      }

      const currentUser = await prisma.users.findUnique({
        where: { id: session.userId },
        select: { id: true, is_admin: true },
      })

      const isOwner = currentUser?.id === userId
      const isAdmin = currentUser?.is_admin || false

      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: "Permission denied" },
          { status: 403 }
        )
      }
    }

    const offset = (page - 1) * pageSize
    let items: ActivityItem[] = []
    let total = 0

    // 根据类型查询不同的活动
    if (type === "topics") {
      items = await getTopicsActivities(userId, pageSize, offset, locale)
      total = await prisma.topics.count({
        where: { user_id: userId, is_deleted: false },
      })
    } else if (type === "posts") {
      items = await getPostsActivities(userId, pageSize, offset, locale)
      total = await prisma.posts.count({
        where: {
          user_id: userId,
          is_deleted: false,
          floor_number: { gt: 1 },
        },
      })
    } else if (type === "likes") {
      items = await getLikesActivities(userId, pageSize, offset, locale)
      total = await prisma.post_likes.count({
        where: {
          user_id: userId,
          post: {
            is_deleted: false,
            topic: {
              is_deleted: false,
            },
          },
        },
      })
    } else if (type === "bookmarks") {
      items = await getBookmarksActivities(userId, pageSize, offset, locale)
      total = await prisma.post_bookmarks.count({
        where: {
          user_id: userId,
          post: {
            is_deleted: false,
            topic: {
              is_deleted: false,
            },
          },
        },
      })
    } else if (type === "all") {
      // 查询所有类型，使用分页参数
      const perTypeLimit = Math.ceil(pageSize / 4)
      const perTypeOffset = Math.floor(offset / 4)

      const [topics, posts, likes, bookmarks] = await Promise.all([
        getTopicsActivities(userId, perTypeLimit, perTypeOffset, locale),
        getPostsActivities(userId, perTypeLimit, perTypeOffset, locale),
        getLikesActivities(userId, perTypeLimit, perTypeOffset, locale),
        getBookmarksActivities(userId, perTypeLimit, perTypeOffset, locale),
      ])

      // 合并所有活动并按时间排序
      const allActivities = [...topics, ...posts, ...likes, ...bookmarks]
      allActivities.sort((a, b) => {
        return (
          new Date(b.activityTime).getTime() -
          new Date(a.activityTime).getTime()
        )
      })

      // 取前 pageSize 条
      items = allActivities.slice(0, pageSize)

      // 计算总数（所有类型的总和）
      const [topicsTotal, postsTotal, likesTotal, bookmarksTotal] =
        await Promise.all([
          prisma.topics.count({
            where: { user_id: userId, is_deleted: false },
          }),
          prisma.posts.count({
            where: {
              user_id: userId,
              is_deleted: false,
              floor_number: { gt: 1 },
            },
          }),
          prisma.post_likes.count({
            where: {
              user_id: userId,
              post: {
                is_deleted: false,
                topic: {
                  is_deleted: false,
                },
              },
            },
          }),
          prisma.post_bookmarks.count({
            where: {
              user_id: userId,
              post: {
                is_deleted: false,
                topic: {
                  is_deleted: false,
                },
              },
            },
          }),
        ])

      total = topicsTotal + postsTotal + likesTotal + bookmarksTotal
    }

    const response: ActivitiesResponse = {
      items,
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching user activities:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
