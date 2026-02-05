import { NextResponse } from "next/server"
import { getLocale } from "next-intl/server"
import { ConversationType, Prisma } from "@prisma/client"
import { z } from "zod"
import { createHash } from "crypto"
import { generateId } from "@/lib/id"
import { prisma } from "@/lib/prisma"
import { getServerSessionUser } from "@/lib/server-auth"

const CreateConversationSchema = z.object({
  type: z.enum(ConversationType).optional().default(ConversationType.SINGLE),
  targetUserId: z.string().optional(),
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

    const body: unknown = await req.json()
    const parsedResult = CreateConversationSchema.safeParse(body)

    if (!parsedResult.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const { type, targetUserId } = parsedResult.data

    if (type !== ConversationType.SINGLE) {
      return NextResponse.json(
        { error: "Only single conversations are supported" },
        { status: 400 }
      )
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "targetUserId is required" },
        { status: 400 }
      )
    }

    const currentUserId: bigint = sessionUser.userId
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
