import { NextResponse } from "next/server"
import { getLocale } from "next-intl/server"
import { ConversationType } from "@prisma/client"
import { put } from "@vercel/blob"
import { prisma } from "@/lib/prisma"
import { getServerSessionUser } from "@/lib/server-auth"
import { getTranslationField } from "@/lib/locale"

const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]

function getExtFromContentType(ct: string): string {
  if (ct.includes("png")) return "png"
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg"
  if (ct.includes("webp")) return "webp"
  if (ct.includes("gif")) return "gif"
  return "jpg"
}

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
      created_by_id: true,
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

    return NextResponse.json({
      conversation: detail,
      isMember,
      isCreator: false,
    })
  }

  const title = getTranslationField(
    conversation.translations,
    locale,
    "title",
    ""
  )

  const isCreator = conversation.created_by_id === userId

  const detail: ConversationDetail = {
    id: String(conversation.id),
    type: conversation.type,
    title: title || null,
    avatar: conversation.avatar,
    memberCount: conversation.members.length,
  }

  return NextResponse.json({ conversation: detail, isMember, isCreator })
}

/**
 * 更新群聊信息
 * PATCH /api/conversations/[id]
 */
export async function PATCH(
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

  const userId = session.userId
  const locale = await getLocale()

  // 查询会话并验证权限
  const conversation = await prisma.conversations.findFirst({
    where: {
      id: conversationId,
      is_deleted: false,
      type: ConversationType.GROUP,
    },
    select: {
      id: true,
      created_by_id: true,
    },
  })

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (conversation.created_by_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // 解析请求数据
  const contentType = req.headers.get("content-type") || ""
  let title: string | undefined
  let avatarFile: File | null = null

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData()
    title = (formData.get("title") as string) || undefined
    avatarFile = formData.get("avatar") as File | null
  } else {
    const body = (await req.json()) as { title?: string }
    title = body.title
  }

  // 处理头像上传
  let avatarUrl: string | undefined
  if (avatarFile && avatarFile.size > 0) {
    if (!ALLOWED_AVATAR_TYPES.includes(avatarFile.type)) {
      return NextResponse.json(
        { error: "Invalid avatar file type" },
        { status: 400 }
      )
    }
    if (avatarFile.size > MAX_AVATAR_SIZE) {
      return NextResponse.json(
        { error: "Avatar file too large" },
        { status: 400 }
      )
    }
    const arrayBuffer = await avatarFile.arrayBuffer()
    const ext = getExtFromContentType(avatarFile.type)
    const key = `conversations/${conversationId.toString()}.${ext}`
    const { url } = await put(key, arrayBuffer, {
      access: "public",
      contentType: avatarFile.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
    avatarUrl = url
  }

  // 更新会话
  await prisma.$transaction(async (tx) => {
    if (avatarUrl) {
      await tx.conversations.update({
        where: { id: conversationId },
        data: { avatar: avatarUrl },
      })
    }

    if (title) {
      // 更新或创建翻译
      await tx.conversation_translations.upsert({
        where: {
          conversation_id_locale: {
            conversation_id: conversationId,
            locale,
          },
        },
        update: { title },
        create: {
          conversation_id: conversationId,
          locale,
          title,
          is_source: true,
        },
      })
    }
  })

  return NextResponse.json({ success: true })
}
