import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Author = {
  id: string
  name: string
  avatar: string
}

type PostItem = {
  id: string
  author: Author
  content: string
  createdAt: string
  minutesAgo: number
}

type RelatedTopicItem = {
  id: string
  title: string
  category: { id: string; name: string; icon?: string }
  tags: { id: string; name: string; icon: string }[]
  replies: number
  views: number
  activity: string
}

type TopicDetailResult = {
  topic: {
    id: string
    title: string
    category: { id: string; name: string; icon?: string }
    tags: { id: string; name: string; icon: string }[]
  }
  posts: PostItem[]
  relatedTopics: RelatedTopicItem[]
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await ctx.params
  let topicId: bigint
  try {
    topicId = BigInt(idStr)
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const topic = await prisma.topics.findFirst({
    where: { id: topicId, is_deleted: false },
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
  })
  if (!topic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const postsDb = await prisma.posts.findMany({
    where: { topic_id: topicId, is_deleted: false },
    select: {
      id: true,
      content: true,
      created_at: true,
      user: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { floor_number: "asc" },
  })
  type PostRow = {
    id: bigint
    content: string
    created_at: Date
    user: { id: bigint; name: string; avatar: string }
  }
  const posts: PostItem[] = postsDb.map((p: PostRow) => ({
    id: String(p.id),
    author: {
      id: String(p.user.id),
      name: p.user.name,
      avatar: p.user.avatar,
    },
    content: p.content,
    createdAt: p.created_at.toISOString(),
    minutesAgo: Math.max(
      Math.round((Date.now() - p.created_at.getTime()) / 60000),
      0
    ),
  }))

  const relatedDb = await prisma.topics.findMany({
    where: {
      is_deleted: false,
      category_id: topic.category.id,
      id: { not: topic.id },
    },
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
    orderBy: { updated_at: "desc" },
    take: 5,
  })
  const relatedIds = relatedDb.map(
    (t: {
      id: bigint
      title: string
      category: { id: bigint; name: string; icon: string | null }
      tag_links: { tag: { id: bigint; name: string; icon: string } }[]
    }) => t.id
  )
  let relatedTopics: RelatedTopicItem[] = []
  if (relatedIds.length > 0) {
    const relatedPosts = await prisma.posts.findMany({
      where: { topic_id: { in: relatedIds }, is_deleted: false },
      select: { topic_id: true, created_at: true },
      orderBy: { created_at: "desc" },
    })
    const agg: Record<string, { replies: number; activity: Date | null }> = {}
    for (const id of relatedIds) {
      agg[String(id)] = { replies: 0, activity: null }
    }
    for (const p of relatedPosts) {
      const key = String(p.topic_id)
      agg[key].replies += 1
      const when = p.created_at
      const current = agg[key].activity
      if (!current || when > current) agg[key].activity = when
    }
    relatedTopics = relatedDb.map(
      (t: {
        id: bigint
        title: string
        category: { id: bigint; name: string; icon: string | null }
        tag_links: { tag: { id: bigint; name: string; icon: string } }[]
      }) => {
        const a = agg[String(t.id)]
        return {
          id: String(t.id),
          title: t.title,
          category: {
            id: String(t.category.id),
            name: t.category.name,
            icon: t.category.icon ?? undefined,
          },
          tags: t.tag_links.map(
            (l: { tag: { id: bigint; name: string; icon: string } }) => ({
              id: String(l.tag.id),
              name: l.tag.name,
              icon: l.tag.icon,
            })
          ),
          replies: Math.max(a.replies - 1, 0),
          views: 0,
          activity: a.activity ? a.activity.toISOString() : "",
        }
      }
    )
  }

  const result: TopicDetailResult = {
    topic: {
      id: String(topic.id),
      title: topic.title,
      category: {
        id: String(topic.category.id),
        name: topic.category.name,
        icon: topic.category.icon ?? undefined,
      },
      tags: topic.tag_links.map(
        (l: { tag: { id: bigint; name: string; icon: string } }) => ({
          id: String(l.tag.id),
          name: l.tag.name,
          icon: l.tag.icon,
        })
      ),
    },
    posts,
    relatedTopics,
  }
  return NextResponse.json(result)
}
