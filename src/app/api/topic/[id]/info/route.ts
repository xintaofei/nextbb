import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { getSessionUser } from "@/lib/auth"

type TopicInfo = {
  id: string
  title: string
  type: string
  isPinned: boolean
  status?: string | null
  endTime?: string | null
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
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  await getSessionUser() // ensure session lookup for consistency (may be used later)
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
      type: true,
      status: true,
      is_pinned: true,
      end_time: true,
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
          description: true,
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
              description: true,
              bg_color: true,
              text_color: true,
            },
          },
        },
      },
    },
  })
  if (!topic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.$executeRaw(
    Prisma.sql`UPDATE topics SET views = views + 1 WHERE id = ${topic.id}`
  )

  const result: TopicInfo = {
    id: String(topic.id),
    title: topic.title,
    type: topic.type || "GENERAL",
    isPinned: topic.is_pinned,
    status: topic.status ?? undefined,
    endTime: topic.end_time ? topic.end_time.toISOString() : null,
    category: {
      id: String(topic.category.id),
      name: topic.category.name,
      icon: topic.category.icon ?? undefined,
      description: topic.category.description,
      bgColor: topic.category.bg_color,
      textColor: topic.category.text_color,
    },
    tags: topic.tag_links.map(
      (l: {
        tag: {
          id: bigint
          name: string
          icon: string
          description: string
          bg_color: string | null
          text_color: string | null
        }
      }) => ({
        id: String(l.tag.id),
        name: l.tag.name,
        icon: l.tag.icon,
        description: l.tag.description,
        bgColor: l.tag.bg_color,
        textColor: l.tag.text_color,
      })
    ),
  }
  return NextResponse.json({ topic: result })
}
