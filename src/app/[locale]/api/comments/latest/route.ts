import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getLocale } from "next-intl/server"
import { getTranslationsQuery } from "@/lib/locale"
import {
  getPostHtmlWithLocale,
  getTopicTitle,
  PostTranslation,
  TopicTranslation,
} from "@/lib/topic-translation"

interface Comment {
  id: bigint
  content: string
  floor_number: number
  created_at: Date
  translations: {
    locale: string
    is_source: boolean
    content_html?: string | null
  }[]
  user: {
    id: bigint
    name: string | null
    avatar: string | null
  }
  topic: {
    id: bigint
    translations: {
      locale: string
      is_source: boolean
      title?: string | null
    }[]
  }
}

export async function GET() {
  const locale = await getLocale()

  const comments = (await prisma.posts.findMany({
    where: {
      is_deleted: false,
      floor_number: {
        gt: 0,
      },
    },
    orderBy: {
      created_at: "desc",
    },
    take: 5,
    select: {
      id: true,
      content: true,
      floor_number: true,
      created_at: true,
      translations: getTranslationsQuery(locale, { content_html: true }),
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      topic: {
        select: {
          id: true,
          translations: getTranslationsQuery(locale, { title: true }),
        },
      },
    },
  })) as unknown as Comment[]

  const result = comments.map((comment) => {
    const { contentHtml, contentLocale } = getPostHtmlWithLocale(
      comment.translations as unknown as PostTranslation[],
      locale
    )

    const topicTitle = getTopicTitle(
      comment.topic.translations as unknown as TopicTranslation[],
      locale
    )

    return {
      id: String(comment.id),
      content: comment.content,
      contentHtml: contentHtml || undefined,
      contentLocale: contentLocale || undefined,
      floorNumber: comment.floor_number,
      createdAt: comment.created_at.toISOString(),
      user: {
        id: String(comment.user.id),
        name: comment.user.name,
        avatar: comment.user.avatar,
      },
      topic: {
        id: String(comment.topic.id),
        title: topicTitle,
      },
    }
  })

  return NextResponse.json(result)
}
