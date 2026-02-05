import { NextResponse } from "next/server"
import { getLocale } from "next-intl/server"
import { ConversationType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getServerSessionUser } from "@/lib/server-auth"
import { getTranslationsQuery, getTranslationField } from "@/lib/locale"

type DiscoverItem = {
  id: string
  title: string
  avatar: string | null
  memberCount: number
  updatedAt: string
  lastMessage: {
    id: string
    content: string
    createdAt: string
  } | null
}

type DiscoverResult = {
  items: DiscoverItem[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

const parsePageNumber = (value: string | null, fallback: number) => {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

export async function GET(req: Request) {
  const session = await getServerSessionUser()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const page = parsePageNumber(searchParams.get("page"), 1)
  const pageSize = parsePageNumber(searchParams.get("pageSize"), 30)
  const skip = (page - 1) * pageSize

  const locale = await getLocale()

  const where = {
    type: ConversationType.GROUP,
    is_deleted: false,
    members: {
      none: {
        user_id: session.userId,
        is_deleted: false,
      },
    },
  }

  const [total, conversations] = await Promise.all([
    prisma.conversations.count({ where }),
    prisma.conversations.findMany({
      where,
      orderBy: { updated_at: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        avatar: true,
        updated_at: true,
        translations: getTranslationsQuery(locale, { title: true }),
        _count: {
          select: { members: true },
        },
        messages: {
          where: { is_deleted: false },
          orderBy: { created_at: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            created_at: true,
          },
        },
      },
    }),
  ])

  const items: DiscoverItem[] = conversations.map((conversation) => {
    const lastMessage = conversation.messages[0] || null
    const title = getTranslationField(
      conversation.translations,
      locale,
      "title",
      ""
    )

    return {
      id: String(conversation.id),
      title: title || "",
      avatar: conversation.avatar,
      memberCount: conversation._count.members,
      updatedAt: conversation.updated_at.toISOString(),
      lastMessage: lastMessage
        ? {
            id: String(lastMessage.id),
            content: lastMessage.content,
            createdAt: lastMessage.created_at.toISOString(),
          }
        : null,
    }
  })

  const result: DiscoverResult = {
    items,
    page,
    pageSize,
    total,
    hasMore: page * pageSize < total,
  }

  return NextResponse.json(result)
}
