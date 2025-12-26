import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

type RelatedTopicItem = {
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
  replies: number
  views: number
  activity: string
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await ctx.params
  let topicId: bigint
  try {
    topicId = BigInt(idStr)
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const current = await prisma.topics.findFirst({
    where: { id: topicId, is_deleted: false },
    select: { id: true, category_id: true },
  })
  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const relatedDb = await prisma.topics.findMany({
    where: {
      is_deleted: false,
      category_id: current.category_id,
      id: { not: current.id },
    },
    select: {
      id: true,
      title: true,
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
    orderBy: { updated_at: "desc" },
    take: 5,
  })
  const relatedIds = relatedDb.map((t) => t.id)

  let relatedTopics: RelatedTopicItem[] = []
  if (relatedIds.length > 0) {
    const viewsRows = await prisma.$queryRaw<{ id: bigint; views: number }[]>(
      Prisma.sql`SELECT id, views FROM topics WHERE id IN (${Prisma.join(
        relatedIds
      )})`
    )
    const viewsById = new Map<string, number>()
    for (const vr of viewsRows) viewsById.set(String(vr.id), vr.views ?? 0)
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
      const currentAct = agg[key].activity
      if (!currentAct || when > currentAct) agg[key].activity = when
    }
    relatedTopics = relatedDb.map((t) => {
      const a = agg[String(t.id)]
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
        tags: t.tag_links.map((l) => ({
          id: String(l.tag.id),
          name: l.tag.name,
          icon: l.tag.icon,
          bgColor: l.tag.bg_color,
          textColor: l.tag.text_color,
        })),
        replies: Math.max(a.replies - 1, 0),
        views: viewsById.get(String(t.id)) ?? 0,
        activity: a.activity ? a.activity.toISOString() : "",
      }
    })
  }

  return NextResponse.json({ relatedTopics })
}
