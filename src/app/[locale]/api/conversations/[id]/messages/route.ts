import { NextResponse } from "next/server"
import { getLocale } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { getServerSessionUser } from "@/lib/server-auth"
import { getTranslationsQuery } from "@/lib/locale"
import { getMessageHtmlWithLocale } from "@/lib/message-translation"

type MessageItem = {
  id: string
  content: string
  contentHtml: string
  contentLocale: string
  sourceLocale: string
  createdAt: string
  isMine: boolean
  sender: {
    id: string
    name: string
    avatar: string | null
    isDeleted: boolean
  }
}

type MessageListResult = {
  items: MessageItem[]
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

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSessionUser()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  let conversationId: bigint
  try {
    conversationId = BigInt(id)
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const { searchParams } = new URL(req.url)
  const page = parsePageNumber(searchParams.get("page"), 1)
  const pageSize = parsePageNumber(searchParams.get("pageSize"), 30)
  const skip = (page - 1) * pageSize

  const conversation = await prisma.conversations.findFirst({
    where: {
      id: conversationId,
      is_deleted: false,
    },
    select: {
      id: true,
    },
  })

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const member = await prisma.conversation_members.findFirst({
    where: {
      conversation_id: conversationId,
      user_id: session.userId,
      is_deleted: false,
    },
    select: { conversation_id: true },
  })

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const locale = await getLocale()

  const [total, messages] = await Promise.all([
    prisma.messages.count({
      where: {
        conversation_id: conversationId,
        is_deleted: false,
      },
    }),
    prisma.messages.findMany({
      where: {
        conversation_id: conversationId,
        is_deleted: false,
      },
      orderBy: { created_at: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        content: true,
        source_locale: true,
        created_at: true,
        sender_id: true,
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            is_deleted: true,
          },
        },
        translations: getTranslationsQuery(locale, { content_html: true }),
      },
    }),
  ])

  const items: MessageItem[] = messages
    .map((message) => {
      const { contentHtml, contentLocale } = getMessageHtmlWithLocale(
        message.translations,
        locale
      )

      return {
        id: String(message.id),
        content: message.content,
        contentHtml,
        contentLocale,
        sourceLocale: message.source_locale,
        createdAt: message.created_at.toISOString(),
        isMine: message.sender_id === session.userId,
        sender: {
          id: String(message.sender.id),
          name: message.sender.name,
          avatar: message.sender.avatar,
          isDeleted: message.sender.is_deleted,
        },
      }
    })
    .reverse()

  const result: MessageListResult = {
    items,
    page,
    pageSize,
    total,
    hasMore: page * pageSize < total,
  }

  return NextResponse.json(result)
}
