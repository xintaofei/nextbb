import { NextResponse } from "next/server"
import { getLocale } from "next-intl/server"
import { z } from "zod"
import { generateId } from "@/lib/id"
import { prisma } from "@/lib/prisma"
import { getServerSessionUser } from "@/lib/server-auth"

const CreateConversationSchema = z.object({
  type: z.enum(["DM", "GROUP"]).optional().default("DM"),
  targetUserId: z.string().optional(),
})

/**
 * 获取当前用户的会话列表
 * GET /api/conversations
 */
export async function GET() {
  try {
    const sessionUser = await getServerSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId: bigint = sessionUser.userId
    const locale: string = await getLocale()

    // 查询用户参与的所有会话
    const conversations = await prisma.conversations.findMany({
      where: {
        is_deleted: false,
        members: {
          some: {
            user_id: userId,
            is_deleted: false,
          },
        },
      },
      include: {
        members: {
          where: { is_deleted: false },
          select: {
            user_id: true,
            last_read_message_id: true,
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
      orderBy: { updated_at: "desc" },
    })

    // 格式化会话列表
    const formattedConversations = conversations.map((conv) => {
      const lastMessage = conv.messages[0] || null
      const currentMember =
        conv.members.find((member) => member.user_id === userId) || null
      const lastReadMessageId: bigint | null =
        currentMember?.last_read_message_id || null
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

      if (conv.type === "DM") {
        const otherMember =
          conv.members.find((member) => member.user_id !== userId) || null
        const otherUser = otherMember?.user || null

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
        memberCount: conv.members.length,
        lastMessage: formattedLastMessage,
        updatedAt: conv.updated_at.toISOString(),
      }
    })

    return NextResponse.json({ conversations: formattedConversations })
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

    if (type !== "DM") {
      return NextResponse.json(
        { error: "Only DM conversations are supported" },
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

    const result = await prisma.$transaction(async (tx) => {
      const existingConversation = await tx.conversations.findFirst({
        where: {
          type: "DM",
          is_deleted: false,
          AND: [
            {
              members: {
                some: {
                  user_id: currentUserId,
                  is_deleted: false,
                },
              },
            },
            {
              members: {
                some: {
                  user_id: targetUserIdBigInt,
                  is_deleted: false,
                },
              },
            },
          ],
        },
        select: { id: true },
      })

      if (existingConversation) {
        return { conversationId: existingConversation.id }
      }

      const newConversation = await tx.conversations.create({
        data: {
          id: generateId(),
          type: "DM",
          members: {
            create: [
              { user_id: currentUserId },
              { user_id: targetUserIdBigInt },
            ],
          },
        },
        select: { id: true },
      })

      return { conversationId: newConversation.id }
    })

    return NextResponse.json({
      conversation: {
        id: String(result.conversationId),
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
