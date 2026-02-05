import { NextResponse } from "next/server"
import { getLocale } from "next-intl/server"
import { ConversationType, Prisma } from "@prisma/client"
import { z } from "zod"
import { createHash } from "crypto"
import { put } from "@vercel/blob"
import { generateId } from "@/lib/id"
import { prisma } from "@/lib/prisma"
import { getServerSessionUser } from "@/lib/server-auth"

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

const CreateConversationSchema = z.object({
  type: z.enum(ConversationType).optional().default(ConversationType.SINGLE),
  targetUserId: z.string().optional(),
  title: z.string().min(1).max(64).optional(),
})

const buildSingleHash = (userIdA: bigint, userIdB: bigint): string => {
  const [lowId, highId] =
    userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA]
  const raw = `SINGLE:${lowId.toString()}:${highId.toString()}`
  return createHash("sha256").update(raw).digest("hex")
}

/**
 * 获取当前用户的会话列表
 * GET /api/conversations
 */
type ConversationListItem = {
  id: string
  type: ConversationType
  otherUser?: {
    id: string
    name: string
    avatar: string | null
    isDeleted: boolean
  } | null
  title?: string | null
  avatar?: string | null
  memberCount?: number
  lastMessage?: {
    id: string
    content: string
    isRead: boolean
    isSentByMe: boolean
    createdAt: string
  } | null
  updatedAt: string
}

type ConversationListResult = {
  items: ConversationListItem[]
  conversations: ConversationListItem[]
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
  try {
    const sessionUser = await getServerSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId: bigint = sessionUser.userId
    const locale: string = await getLocale()

    const { searchParams } = new URL(req.url)
    const highlightId = searchParams.get("highlightId")
    const page = parsePageNumber(searchParams.get("page"), 1)
    const pageSize = parsePageNumber(searchParams.get("pageSize"), 30)
    const skip = (page - 1) * pageSize

    let highlightConversationId: bigint | null = null
    if (highlightId) {
      try {
        highlightConversationId = BigInt(highlightId)
      } catch {
        highlightConversationId = null
      }
    }

    const where = {
      is_deleted: false,
      members: {
        some: {
          user_id: userId,
          is_deleted: false,
        },
      },
    }

    const [total, conversations] = await Promise.all([
      prisma.conversations.count({ where }),
      prisma.conversations.findMany({
        where,
        select: {
          id: true,
          type: true,
          avatar: true,
          updated_at: true,
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
              sender_id: true,
            },
          },
        },
        orderBy: { updated_at: "desc" },
        skip,
        take: pageSize,
      }),
    ])

    const highlightConversation =
      highlightConversationId && page === 1
        ? await prisma.conversations.findFirst({
            where: {
              id: highlightConversationId,
              is_deleted: false,
              members: {
                some: {
                  user_id: userId,
                  is_deleted: false,
                },
              },
            },
            select: {
              id: true,
              type: true,
              avatar: true,
              updated_at: true,
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
                  sender_id: true,
                },
              },
            },
          })
        : null

    const conversationsForMaps = highlightConversation
      ? [highlightConversation, ...conversations]
      : conversations
    const conversationIds = Array.from(
      new Set(conversationsForMaps.map((conv) => conv.id))
    )
    const singleConversationIds = Array.from(
      new Set(
        conversationsForMaps
          .filter((conv) => conv.type === ConversationType.SINGLE)
          .map((conv) => conv.id)
      )
    )

    const [memberStates, otherMembers] = await Promise.all([
      prisma.conversation_members.findMany({
        where: {
          conversation_id: { in: conversationIds },
          user_id: userId,
          is_deleted: false,
        },
        select: {
          conversation_id: true,
          last_read_message_id: true,
        },
      }),
      singleConversationIds.length > 0
        ? prisma.conversation_members.findMany({
            where: {
              conversation_id: { in: singleConversationIds },
              user_id: { not: userId },
              is_deleted: false,
            },
            select: {
              conversation_id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  is_deleted: true,
                },
              },
            },
          })
        : Promise.resolve([]),
    ])

    const lastReadMap = new Map<string, bigint | null>(
      memberStates.map((member) => [
        String(member.conversation_id),
        member.last_read_message_id || null,
      ])
    )

    const otherUserMap = new Map<
      string,
      { id: bigint; name: string; avatar: string | null; is_deleted: boolean }
    >(
      otherMembers.map((member) => [
        String(member.conversation_id),
        member.user,
      ])
    )

    // 格式化会话列表
    const formatConversation = (conv: (typeof conversations)[number]) => {
      const lastMessage = conv.messages[0] || null
      const lastReadMessageId: bigint | null =
        lastReadMap.get(String(conv.id)) || null
      const isRead = lastMessage
        ? lastMessage.sender_id === userId ||
          (lastReadMessageId !== null && lastReadMessageId >= lastMessage.id)
        : true
      const formattedLastMessage = lastMessage
        ? {
            id: String(lastMessage.id),
            content: lastMessage.content,
            isRead,
            isSentByMe: lastMessage.sender_id === userId,
            createdAt: lastMessage.created_at.toISOString(),
          }
        : null

      if (conv.type === ConversationType.SINGLE) {
        const otherUser = otherUserMap.get(String(conv.id)) || null

        return {
          id: String(conv.id),
          type: conv.type,
          otherUser: otherUser
            ? {
                id: String(otherUser.id),
                name: otherUser.name,
                avatar: otherUser.avatar,
                isDeleted: otherUser.is_deleted,
              }
            : null,
          lastMessage: formattedLastMessage,
          updatedAt: conv.updated_at.toISOString(),
        }
      }

      const titleTranslation =
        conv.translations.find((item) => item.locale === locale) ||
        conv.translations.find((item) => item.is_source) ||
        null

      return {
        id: String(conv.id),
        type: conv.type,
        title: titleTranslation ? titleTranslation.title : null,
        avatar: conv.avatar,
        memberCount: conv._count.members,
        lastMessage: formattedLastMessage,
        updatedAt: conv.updated_at.toISOString(),
      }
    }

    let formattedConversations: ConversationListItem[] = conversations.map(
      (conv) => formatConversation(conv)
    )

    if (highlightConversation) {
      formattedConversations.unshift(formatConversation(highlightConversation))
    }

    if (highlightId) {
      const seen = new Set<string>()
      formattedConversations = formattedConversations.filter((item) => {
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })
    }

    const result: ConversationListResult = {
      items: formattedConversations,
      conversations: formattedConversations,
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    )
  }
}

/**
 * 创建新会话
 * POST /api/conversations
 */
export async function POST(req: Request) {
  try {
    const sessionUser = await getServerSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contentType = req.headers.get("content-type") || ""
    let type: string = ConversationType.SINGLE
    let targetUserId: string | undefined
    let title: string | undefined
    let avatarFile: File | null = null

    // 解析请求数据
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData()
      type = (formData.get("type") as string) || ConversationType.SINGLE
      targetUserId = (formData.get("targetUserId") as string) || undefined
      title = (formData.get("title") as string) || undefined
      avatarFile = formData.get("avatar") as File | null
    } else {
      const body: unknown = await req.json()
      const parsedResult = CreateConversationSchema.safeParse(body)
      if (!parsedResult.success) {
        return NextResponse.json(
          { error: "Invalid request body" },
          { status: 400 }
        )
      }
      type = parsedResult.data.type
      targetUserId = parsedResult.data.targetUserId
      title = parsedResult.data.title
    }

    const currentUserId: bigint = sessionUser.userId
    const locale: string = await getLocale()

    // 创建群聊
    if (type === ConversationType.GROUP) {
      if (!title) {
        return NextResponse.json(
          { error: "title is required for group" },
          { status: 400 }
        )
      }

      // 处理头像上传
      let avatarUrl: string | null = null
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
        const conversationId = generateId()
        const ext = getExtFromContentType(avatarFile.type)
        const key = `conversations/${conversationId.toString()}.${ext}`
        const { url } = await put(key, arrayBuffer, {
          access: "public",
          contentType: avatarFile.type,
          token: process.env.BLOB_READ_WRITE_TOKEN,
        })
        avatarUrl = url

        const groupHash = `GROUP:${conversationId.toString()}`
        const newConversation = await prisma.conversations.create({
          data: {
            id: conversationId,
            type: ConversationType.GROUP,
            hash: groupHash,
            avatar: avatarUrl,
            source_locale: locale,
            created_by_id: currentUserId,
            members: {
              create: [{ user_id: currentUserId }],
            },
            translations: {
              create: [{ locale, title, is_source: true }],
            },
          },
          select: { id: true, avatar: true },
        })

        return NextResponse.json({
          conversation: {
            id: String(newConversation.id),
            title,
            avatar: newConversation.avatar,
          },
        })
      }

      const groupHash = `GROUP:${generateId().toString()}`
      const newConversation = await prisma.conversations.create({
        data: {
          id: generateId(),
          type: ConversationType.GROUP,
          hash: groupHash,
          source_locale: locale,
          created_by_id: currentUserId,
          members: {
            create: [{ user_id: currentUserId }],
          },
          translations: {
            create: [{ locale, title, is_source: true }],
          },
        },
        select: { id: true },
      })

      return NextResponse.json({
        conversation: {
          id: String(newConversation.id),
          title,
        },
      })
    }

    // 创建单聊
    if (!targetUserId) {
      return NextResponse.json(
        { error: "targetUserId is required" },
        { status: 400 }
      )
    }

    const targetUserIdBigInt: bigint = BigInt(targetUserId)
    const dmHash: string = buildSingleHash(currentUserId, targetUserIdBigInt)

    // 不能和自己创建会话
    if (currentUserId === targetUserIdBigInt) {
      return NextResponse.json(
        { error: "Cannot create conversation with yourself" },
        { status: 400 }
      )
    }

    // 验证目标用户是否存在
    const targetUser = await prisma.users.findUnique({
      where: { id: targetUserIdBigInt },
      select: {
        id: true,
        name: true,
        avatar: true,
        is_deleted: true,
      },
    })

    if (!targetUser || targetUser.is_deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const existingConversation = await prisma.conversations.findFirst({
      where: {
        type: ConversationType.SINGLE,
        hash: dmHash,
        is_deleted: false,
      },
      select: { id: true },
    })

    if (existingConversation) {
      return NextResponse.json({
        conversation: {
          id: String(existingConversation.id),
          otherUser: {
            id: String(targetUser.id),
            name: targetUser.name,
            avatar: targetUser.avatar,
          },
        },
      })
    }

    let conversationId: bigint

    try {
      const newConversation = await prisma.conversations.create({
        data: {
          id: generateId(),
          type: "SINGLE",
          hash: dmHash,
          members: {
            create: [
              { user_id: currentUserId },
              { user_id: targetUserIdBigInt },
            ],
          },
        },
        select: { id: true },
      })

      conversationId = newConversation.id
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const racedConversation = await prisma.conversations.findFirst({
          where: {
            type: ConversationType.SINGLE,
            hash: dmHash,
            is_deleted: false,
          },
          select: { id: true },
        })

        if (!racedConversation) {
          throw error
        }

        conversationId = racedConversation.id
      } else {
        throw error
      }
    }

    return NextResponse.json({
      conversation: {
        id: String(conversationId),
        otherUser: {
          id: String(targetUser.id),
          name: targetUser.name,
          avatar: targetUser.avatar,
        },
      },
    })
  } catch (error) {
    console.error("Error creating conversation:", error)
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    )
  }
}
