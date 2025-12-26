import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { getSessionUser } from "@/lib/auth"

type TopicInfo = {
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
    category: {
      id: String(topic.category.id),
      name: topic.category.name,
      icon: topic.category.icon ?? undefined,
      bgColor: topic.category.bg_color,
      textColor: topic.category.text_color,
    },
    tags: topic.tag_links.map(
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
    ),
  }
  return NextResponse.json({ topic: result })
}
