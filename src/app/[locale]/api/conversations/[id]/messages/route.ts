import { NextResponse } from "next/server"
import { getLocale } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { getServerSessionUser } from "@/lib/server-auth"
import { getTranslationsQuery } from "@/lib/locale"
import { getMessageHtmlWithLocale } from "@/lib/message-translation"
import { z } from "zod"
import { generateId } from "@/lib/id"
import { TranslationEntityType } from "@prisma/client"
import { createTranslationTasks } from "@/lib/services/translation-task"

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

const MessageCreateSchema = z.object({
  content: z.string().min(1).max(10000),
  content_html: z.string(),
})

type MessageCreateDTO = z.infer<typeof MessageCreateSchema>

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await getServerSessionUser()
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: idStr } = await ctx.params
  const locale = await getLocale()
  let conversationId: bigint
  try {
    conversationId = BigInt(idStr)
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let body: MessageCreateDTO
  try {
    const json = await req.json()
    body = MessageCreateSchema.parse(json)
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  // Check if conversation exists and is not deleted
  const conversation = await prisma.conversations.findFirst({
    where: { id: conversationId, is_deleted: false },
    select: { id: true },
  })
  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    )
  }

  // Check if user is a member of the conversation
  const member = await prisma.conversation_members.findUnique({
    where: {
      conversation_id_user_id: {
        conversation_id: conversationId,
        user_id: auth.userId,
      },
    },
  })
  if (!member) {
    return NextResponse.json(
      { error: "Forbidden: not a conversation member" },
      { status: 403 }
    )
  }

  // Create message in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create message with translation
    const message = await tx.messages.create({
      data: {
        id: generateId(),
        conversation_id: conversationId,
        sender_id: auth.userId,
        content: body.content,
        source_locale: locale,
        translations: {
          create: {
            locale: locale,
            content_html: body.content_html,
            is_source: true,
            version: 1,
          },
        },
        is_deleted: false,
      },
      select: { id: true, created_at: true },
    })

    // Update conversation last_message_id and updated_at
    await tx.conversations.update({
      where: { id: conversationId },
      data: {
        last_message_id: message.id,
        updated_at: new Date(),
      },
    })

    return {
      messageId: String(message.id),
      createdAt: message.created_at.toISOString(),
    }
  })

  // Create translation tasks outside transaction
  try {
    const messageId = BigInt(result.messageId)
    await createTranslationTasks(
      TranslationEntityType.MESSAGE,
      messageId,
      locale,
      1
    )
  } catch (error) {
    console.error("Failed to create translation tasks:", error)
  }

  return NextResponse.json(result, { status: 201 })
}
