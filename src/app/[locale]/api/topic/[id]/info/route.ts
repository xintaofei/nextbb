import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { getSessionUser } from "@/lib/auth"
import { getLocale } from "next-intl/server"
import { getTranslationsQuery, getTranslationFields } from "@/lib/locale"
import { getTopicTitle } from "@/lib/topic-translation"

type TopicInfo = {
  id: string
  title: string
  type: string
  isPinned: boolean
  isCommunity: boolean
  status?: string | null
  endTime?: string | null
  isSettled?: boolean
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
  views: number
  participantCount: number
  participants: {
    id: string
    name: string
    avatar: string
  }[]
  lastActiveTime?: string
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  await getSessionUser() // ensure session lookup for consistency (may be used later)
  const locale = await getLocale()
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
      views: true,
      translations: getTranslationsQuery(locale, { title: true }),
      type: true,
      status: true,
      is_pinned: true,
      is_community: true,
      end_time: true,
      is_settled: true,
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
    },
  })
  if (!topic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.$executeRaw(
    Prisma.sql`UPDATE topics SET views = views + 1 WHERE id = ${topic.id}`
  )

  const [participants, participantCountData, lastPost] = await Promise.all([
    prisma.posts.findMany({
      where: { topic_id: topicId, is_deleted: false },
      select: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { created_at: "asc" },
      distinct: ["user_id"],
      take: 5,
    }),
    prisma.posts.groupBy({
      by: ["user_id"],
      where: { topic_id: topicId, is_deleted: false },
    }),
    prisma.posts.findFirst({
      where: { topic_id: topicId, is_deleted: false },
      orderBy: { created_at: "desc" },
      select: { created_at: true },
    }),
  ])

  const categoryFields = getTranslationFields(
    topic.category.translations,
    locale,
    { name: "", description: null }
  )

  const result: TopicInfo = {
    id: String(topic.id),
    title: getTopicTitle(topic.translations, locale),
    type: topic.type || "GENERAL",
    isPinned: topic.is_pinned,
    isCommunity: topic.is_community ?? false,
    status: topic.status ?? undefined,
    endTime: topic.end_time ? topic.end_time.toISOString() : null,
    isSettled: topic.is_settled,
    category: {
      id: String(topic.category.id),
      name: categoryFields.name,
      icon: topic.category.icon ?? undefined,
      description: categoryFields.description,
      bgColor: topic.category.bg_color,
      textColor: topic.category.text_color,
    },
    tags: topic.tag_links.map((l) => {
      const tagFields = getTranslationFields(l.tag.translations, locale, {
        name: "",
        description: null,
      })
      return {
        id: String(l.tag.id),
        name: tagFields.name,
        icon: l.tag.icon,
        description: tagFields.description,
        bgColor: l.tag.bg_color,
        textColor: l.tag.text_color,
      }
    }),
    views: topic.views + 1,
    participantCount: participantCountData.length,
    participants: participants.map((p) => ({
      id: String(p.user.id),
      name: p.user.name,
      avatar: p.user.avatar,
    })),
    lastActiveTime: lastPost?.created_at.toISOString(),
  }
  return NextResponse.json({ topic: result })
}
