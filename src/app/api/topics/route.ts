import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getSessionUser } from "@/lib/auth"
import { generateId } from "@/lib/id"

interface TopicsDelegate {
  create(args: unknown): Promise<{ id: bigint }>
}

interface PostsDelegate {
  create(args: unknown): Promise<{ id: bigint }>
}

interface TopicTagsDelegate {
  createMany(args: unknown): Promise<{ count: number }>
}

interface TxClient {
  topics: TopicsDelegate
  posts: PostsDelegate
  topic_tags: TopicTagsDelegate
}

const TopicListQuery = z.object({
  categoryId: z.string().regex(/^\d+$/).optional(),
  tagId: z.string().regex(/^\d+$/).optional(),
  sort: z.enum(["latest", "hot", "community"]).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  pageSize: z.string().regex(/^\d+$/).optional(),
})

type TopicParticipant = {
  id: string
  name: string
  avatar: string
}

type TopicListItem = {
  id: string
  title: string
  category: {
    id: string
    name: string
    icon?: string
    bgColor?: string | null
    textColor?: string | null
  }
  tags: {
    id: string
    name: string
    icon: string
    bgColor?: string | null
    textColor?: string | null
  }[]
  participants: TopicParticipant[]
  replies: number
  views: number
  activity: string
  isPinned: boolean
}

type TopicListResult = {
  items: TopicListItem[]
  page: number
  pageSize: number
  total: number
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = TopicListQuery.safeParse({
    categoryId: url.searchParams.get("categoryId") ?? undefined,
    tagId: url.searchParams.get("tagId") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  })
  if (!q.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 })
  }
  const page = q.data.page ? Number(q.data.page) : 1
  const pageSize = q.data.pageSize ? Number(q.data.pageSize) : 20
  const where: {
    is_deleted: boolean
    category_id?: bigint
    tag_links?: { some: { tag_id: bigint } }
    is_community?: boolean
  } = {
    is_deleted: false,
    ...(q.data.categoryId
      ? { category_id: BigInt(q.data.categoryId) }
      : undefined),
    ...(q.data.tagId
      ? { tag_links: { some: { tag_id: BigInt(q.data.tagId) } } }
      : undefined),
  }
  const sortMode = q.success && q.data.sort ? q.data.sort : "latest"
  if (sortMode === "community") {
    where.is_community = true
  }
  const total = await prisma.topics.count({
    where,
  })
  const topics = await prisma.topics.findMany({
    where,
    include: {
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
              bg_color: true,
              text_color: true,
            },
          },
        },
      },
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { id: "desc" },
  })
  type TopicRow = {
    id: bigint
    title: string
    views: number
    is_pinned: boolean
    is_community: boolean
    category: {
      id: bigint
      name: string
      icon: string
      bg_color: string | null
      text_color: string | null
    }
    tag_links: {
      tag: {
        id: bigint
        name: string
        icon: string
        bg_color: string | null
        text_color: string | null
      }
    }[]
  }
  const topicsX = topics as unknown as TopicRow[]
  const topicIds = topicsX.map((t) => t.id)
  const posts = await prisma.posts.findMany({
    where: { topic_id: { in: topicIds }, is_deleted: false },
    select: {
      topic_id: true,
      user: { select: { id: true, name: true, avatar: true } },
      created_at: true,
      updated_at: true,
    },
    orderBy: { created_at: "asc" },
  })
  const byTopic: Record<
    string,
    {
      participants: TopicParticipant[]
      replies: number
      activity: Date | null
    }
  > = {}
  for (const t of topicIds) {
    byTopic[String(t)] = { participants: [], replies: 0, activity: null }
  }
  const seen: Record<string, Set<string>> = {}
  for (const p of posts) {
    const key = String(p.topic_id)
    if (!seen[key]) seen[key] = new Set<string>()
    if (!seen[key].has(String(p.user.id))) {
      if (byTopic[key].participants.length < 5) {
        byTopic[key].participants.push({
          id: String(p.user.id),
          name: p.user.name,
          avatar: p.user.avatar,
        })
      }
      seen[key].add(String(p.user.id))
    }
    byTopic[key].replies += 1
    const t = byTopic[key].activity
    const when = p.updated_at ?? p.created_at
    if (!t || when > t) byTopic[key].activity = when
  }
  const items: TopicListItem[] = topicsX.map((t) => {
    const agg = byTopic[String(t.id)]
    const tags = t.tag_links.map(
      (l: {
        tag: {
          id: bigint
          name: string
          icon: string
          bg_color: string | null
          text_color: string | null
        }
      }) => ({
        id: String(l.tag.id),
        name: l.tag.name,
        icon: l.tag.icon,
        bgColor: l.tag.bg_color,
        textColor: l.tag.text_color,
      })
    )
    return {
      id: String(t.id),
      title: t.title,
      category: {
        id: String(t.category.id),
        name: t.category.name,
        icon: t.category.icon ?? undefined,
        bgColor: t.category.bg_color,
        textColor: t.category.text_color,
      },
      tags,
      participants: agg.participants,
      replies: Math.max(agg.replies - 1, 0),
      views: t.views ?? 0,
      activity: agg.activity ? agg.activity.toISOString() : "",
      isPinned: Boolean(t.is_pinned),
    }
  })
  let sorted = items
  if (sortMode === "hot") {
    sorted = [...items].sort((a, b) => b.replies - a.replies)
  } else if (sortMode === "latest") {
    sorted = [...items].sort((a, b) => {
      const pa = a.isPinned ? 1 : 0
      const pb = b.isPinned ? 1 : 0
      if (pb !== pa) return pb - pa
      const ta = a.activity ? new Date(a.activity).getTime() : 0
      const tb = b.activity ? new Date(b.activity).getTime() : 0
      return tb - ta
    })
  } else {
    sorted = [...items].sort((a, b) => {
      const ta = a.activity ? new Date(a.activity).getTime() : 0
      const tb = b.activity ? new Date(b.activity).getTime() : 0
      return tb - ta
    })
  }
  const result: TopicListResult = {
    items: sorted,
    page,
    pageSize,
    total,
  }
  return NextResponse.json(result)
}
const TopicCreateSchema = z.object({
  title: z.string().min(1).max(256),
  categoryId: z.string().regex(/^\d+$/),
  content: z.string().min(1),
  tags: z.array(z.string().min(1).max(32)).max(5),
  isPinned: z.boolean().optional(),
  isCommunity: z.boolean().optional(),
})

type TopicCreateDTO = z.infer<typeof TopicCreateSchema>

type TopicCreateResult = {
  topicId: string
}

export async function POST(req: Request) {
  const auth = await getSessionUser()
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: TopicCreateDTO
  try {
    const json = await req.json()
    body = TopicCreateSchema.parse(json)
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const user = await prisma.users.findUnique({
    where: { id: auth.userId },
    select: { is_admin: true },
  })
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const isAdmin = user.is_admin === true
  const isPinned = isAdmin ? Boolean(body.isPinned) : false
  const isCommunity = isAdmin ? Boolean(body.isCommunity) : false

  let categoryId: bigint
  try {
    categoryId = BigInt(body.categoryId)
  } catch {
    return NextResponse.json({ error: "Invalid categoryId" }, { status: 400 })
  }

  const category = await prisma.categories.findFirst({
    where: { id: categoryId, is_deleted: false },
    select: { id: true },
  })
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 })
  }

  const tagNames = [...new Set(body.tags.map((t: string) => t.trim()))].filter(
    (t) => t.length > 0
  )

  const tags = await prisma.tags.findMany({
    where: { name: { in: tagNames }, is_deleted: false },
    select: { id: true, name: true },
  })

  const foundNames = new Set(
    tags.map((t: { id: bigint; name: string }) => t.name)
  )
  const missing = tagNames.filter((n) => !foundNames.has(n))
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Unknown tags", details: missing },
      { status: 400 }
    )
  }

  const result = await prisma.$transaction(async (tx: unknown) => {
    const client = tx as TxClient
    const topic = await client.topics.create({
      data: {
        id: generateId(),
        category_id: categoryId,
        user_id: auth.userId,
        title: body.title,
        is_pinned: isPinned,
        is_community: isCommunity,
        is_deleted: false,
      },
      select: { id: true },
    })

    await client.posts.create({
      data: {
        id: generateId(),
        topic_id: topic.id,
        user_id: auth.userId,
        parent_id: BigInt(0),
        reply_to_user_id: BigInt(0),
        floor_number: 1,
        content: body.content,
        is_deleted: false,
      },
      select: { id: true },
    })

    if (tags.length > 0) {
      await client.topic_tags.createMany({
        data: tags.map((t: { id: bigint; name: string }) => ({
          topic_id: topic.id,
          tag_id: t.id,
          created_at: new Date(),
        })),
        skipDuplicates: true,
      })
    }

    return { topicId: String(topic.id) }
  })

  const response: TopicCreateResult = { topicId: result.topicId }
  return NextResponse.json(response, { status: 201 })
}
