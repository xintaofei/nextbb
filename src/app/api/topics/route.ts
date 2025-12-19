import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getSessionUser } from "@/lib/auth"
import { generateId } from "@/lib/id"

const TopicListQuery = z.object({
  categoryId: z.string().regex(/^\d+$/).optional(),
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
  category: { id: string; name: string; icon?: string }
  tags: { id: string; name: string; icon: string }[]
  participants: TopicParticipant[]
  replies: number
  views: number
  activity: string
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
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  })
  if (!q.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 })
  }
  const page = q.data.page ? Number(q.data.page) : 1
  const pageSize = q.data.pageSize ? Number(q.data.pageSize) : 20
  const where = {
    is_deleted: false,
    ...(q.data.categoryId
      ? { category_id: BigInt(q.data.categoryId) }
      : undefined),
  }
  const total = await prisma.topics.count({ where })
  const topics = await prisma.topics.findMany({
    where,
    select: {
      id: true,
      title: true,
      category: { select: { id: true, name: true, icon: true } },
      tag_links: {
        select: {
          tag: { select: { id: true, name: true, icon: true } },
        },
      },
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { id: "desc" },
  })
  const topicIds = topics.map((t) => t.id)
  const posts = await prisma.posts.findMany({
    where: { topic_id: { in: topicIds }, is_deleted: false },
    select: {
      topic_id: true,
      user: { select: { id: true, name: true, avatar: true } },
      created_at: true,
      updated_at: true,
    },
    orderBy: { created_at: "desc" },
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
  const items: TopicListItem[] = topics.map((t) => {
    const agg = byTopic[String(t.id)]
    const tags = t.tag_links.map((l) => ({
      id: String(l.tag.id),
      name: l.tag.name,
      icon: l.tag.icon,
    }))
    return {
      id: String(t.id),
      title: t.title,
      category: {
        id: String(t.category.id),
        name: t.category.name,
        icon: t.category.icon ?? undefined,
      },
      tags,
      participants: agg.participants,
      replies: Math.max(agg.replies - 1, 0),
      views: 0,
      activity: agg.activity ? agg.activity.toISOString() : "",
    }
  })
  const result: TopicListResult = {
    items,
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

  const tagNames = [...new Set(body.tags.map((t) => t.trim()))].filter(
    (t) => t.length > 0
  )

  const tags = await prisma.tags.findMany({
    where: { name: { in: tagNames }, is_deleted: false },
    select: { id: true, name: true },
  })

  const foundNames = new Set(tags.map((t) => t.name))
  const missing = tagNames.filter((n) => !foundNames.has(n))
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Unknown tags", details: missing },
      { status: 400 }
    )
  }

  const result = await prisma.$transaction(async (tx) => {
    const topic = await tx.topics.create({
      data: {
        id: generateId(),
        category_id: categoryId,
        user_id: auth.userId,
        title: body.title,
        is_deleted: false,
      },
      select: { id: true },
    })

    await tx.posts.create({
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
      await tx.topic_tags.createMany({
        data: tags.map((t, i) => ({
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
