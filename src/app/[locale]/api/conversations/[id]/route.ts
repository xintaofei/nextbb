import { NextResponse } from "next/server"
import { getLocale } from "next-intl/server"
import { ConversationType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getServerSessionUser } from "@/lib/server-auth"
import { getTranslationField } from "@/lib/locale"

type ConversationDetail = {
  id: string
  type: ConversationType
  title: string | null
  avatar: string | null
  memberCount: number
  otherUser?: {
    id: string
    name: string
    avatar: string | null
    isDeleted: boolean
  } | null
}

export async function GET(
  _req: Request,
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

  const locale = await getLocale()
  const userId = session.userId

  const conversation = await prisma.conversations.findFirst({
    where: {
      id: conversationId,
      is_deleted: false,
    },
    select: {
      id: true,
      type: true,
      avatar: true,
      members: {
        where: { is_deleted: false },
        select: {
          user_id: true,
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              is_deleted: true,
            },
          },
        },
      },
      translations: {
        where: {
          OR: [{ locale }, { is_source: true }],
        },
        select: {
          locale: true,
          title: true,
          is_source: true,
        },
      },
    },
  })

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const isMember = conversation.members.some(
    (member) => member.user_id === userId
  )

  if (conversation.type === ConversationType.SINGLE && !isMember) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (conversation.type === ConversationType.SINGLE) {
    const otherMember =
      conversation.members.find((member) => member.user_id !== userId) || null
    const otherUser = otherMember?.user || null

    const detail: ConversationDetail = {
      id: String(conversation.id),
      type: conversation.type,
      title: otherUser?.name || null,
      avatar: otherUser?.avatar || null,
      memberCount: conversation.members.length,
      otherUser: otherUser
        ? {
            id: String(otherUser.id),
            name: otherUser.name,
            avatar: otherUser.avatar,
            isDeleted: otherUser.is_deleted,
          }
        : null,
    }

    return NextResponse.json({ conversation: detail, isMember })
  }

  const title = getTranslationField(
    conversation.translations,
    locale,
    "title",
    ""
  )

  const detail: ConversationDetail = {
    id: String(conversation.id),
    type: conversation.type,
    title: title || null,
    avatar: conversation.avatar,
    memberCount: conversation.members.length,
  }

  return NextResponse.json({ conversation: detail, isMember })
}
