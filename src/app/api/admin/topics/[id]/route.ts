import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

type TopicDetail = {
  id: string
  title: string
  type: string
  author: {
    id: string
    name: string
    avatar: string
    email: string
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
  }>
  content: string
  replies: number
  views: number
  isPinned: boolean
  isCommunity: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  lastActivity: string
}

// 权限验证
async function verifyAdmin(userId: bigint) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { is_admin: true, is_deleted: true, status: true },
  })

  if (!user || user.is_deleted || user.status !== 1 || !user.is_admin) {
    return false
  }
  return true
}

// GET - 获取主题详情
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getSessionUser()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = await verifyAdmin(auth.userId)
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: idStr } = await context.params
    let topicId: bigint
    try {
      topicId = BigInt(idStr)
    } catch {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    }

    // 查询主题
    const topic = await prisma.topics.findUnique({
      where: { id: topicId },
      select: {
        id: true,
        title: true,
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
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            bg_color: true,
            text_color: true,
          },
        },
        tag_links: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                icon: true,
              },
            },
          },
        },
        posts: {
          where: {
            floor_number: 1,
          },
          select: {
            content: true,
          },
          take: 1,
        },
      },
    })

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    // 统计回复数和最后活跃时间
    const postsStats = await prisma.posts.aggregate({
      where: {
        topic_id: topicId,
      },
      _count: {
        id: true,
      },
      _max: {
        created_at: true,
      },
    })

    const replies = Math.max((postsStats._count.id || 0) - 1, 0)
    const lastActivity = postsStats._max.created_at || topic.created_at

    const result: TopicDetail = {
      id: String(topic.id),
      title: topic.title,
      type: topic.type || "GENERAL",
      author: {
        id: String(topic.user.id),
        name: topic.user.name,
        avatar: topic.user.avatar,
        email: topic.user.email,
      },
      category: {
        id: String(topic.category.id),
        name: topic.category.name,
        icon: topic.category.icon,
        bgColor: topic.category.bg_color,
        textColor: topic.category.text_color,
      },
      tags: topic.tag_links.map((link) => ({
        id: String(link.tag.id),
        name: link.tag.name,
        icon: link.tag.icon,
      })),
      content: topic.posts[0]?.content || "",
      replies,
      views: topic.views,
      isPinned: topic.is_pinned,
      isCommunity: topic.is_community,
      isDeleted: topic.is_deleted,
      createdAt: topic.created_at.toISOString(),
      updatedAt: topic.updated_at.toISOString(),
      lastActivity: lastActivity.toISOString(),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Get topic detail error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - 更新主题
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getSessionUser()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = await verifyAdmin(auth.userId)
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: idStr } = await context.params
    let topicId: bigint
    try {
      topicId = BigInt(idStr)
    } catch {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    }

    const body = await request.json()
    const { title, categoryId, tagIds, isPinned, isCommunity, isDeleted } = body

    // 查询主题是否存在
    const topic = await prisma.topics.findUnique({
      where: { id: topicId },
      select: { id: true },
    })

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    // 验证标题
    if (
      title !== undefined &&
      (typeof title !== "string" || title.length < 1 || title.length > 256)
    ) {
      return NextResponse.json(
        { error: "Title must be between 1-256 characters" },
        { status: 400 }
      )
    }

    // 验证分类ID
    let newCategoryId: bigint | undefined
    if (categoryId !== undefined) {
      try {
        newCategoryId = BigInt(categoryId)
        const category = await prisma.categories.findFirst({
          where: { id: newCategoryId, is_deleted: false },
          select: { id: true },
        })
        if (!category) {
          return NextResponse.json(
            { error: "Category not found or deleted" },
            { status: 400 }
          )
        }
      } catch {
        return NextResponse.json(
          { error: "Invalid categoryId" },
          { status: 400 }
        )
      }
    }

    // 验证标签ID
    let newTagIds: bigint[] | undefined
    if (tagIds !== undefined && Array.isArray(tagIds)) {
      try {
        newTagIds = tagIds.map((id) => BigInt(id))
        const tags = await prisma.tags.findMany({
          where: { id: { in: newTagIds }, is_deleted: false },
          select: { id: true },
        })
        if (tags.length !== newTagIds.length) {
          return NextResponse.json(
            { error: "Some tags not found or deleted" },
            { status: 400 }
          )
        }
      } catch {
        return NextResponse.json({ error: "Invalid tagIds" }, { status: 400 })
      }
    }

    // 构建更新数据
    const updateData: {
      title?: string
      category_id?: bigint
      is_pinned?: boolean
      is_community?: boolean
      is_deleted?: boolean
    } = {}

    if (title !== undefined) {
      updateData.title = title
    }
    if (newCategoryId !== undefined) {
      updateData.category_id = newCategoryId
    }
    if (typeof isPinned === "boolean") {
      updateData.is_pinned = isPinned
    }
    if (typeof isCommunity === "boolean") {
      updateData.is_community = isCommunity
    }
    if (typeof isDeleted === "boolean") {
      updateData.is_deleted = isDeleted
    }

    // 使用事务更新
    await prisma.$transaction(async (tx) => {
      // 更新主题基本信息
      if (Object.keys(updateData).length > 0) {
        await tx.topics.update({
          where: { id: topicId },
          data: updateData,
        })
      }

      // 更新标签关联
      if (newTagIds !== undefined) {
        // 删除旧的标签关联
        await tx.topic_tags.deleteMany({
          where: { topic_id: topicId },
        })

        // 创建新的标签关联
        if (newTagIds.length > 0) {
          await tx.topic_tags.createMany({
            data: newTagIds.map((tagId) => ({
              topic_id: topicId,
              tag_id: tagId,
            })),
            skipDuplicates: true,
          })
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update topic error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
