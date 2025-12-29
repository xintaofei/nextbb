import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import { generateId } from "@/lib/id"

/**
 * 获取当前用户的会话列表
 * GET /api/conversations
 */
export async function GET() {
  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = sessionUser.userId

    // 查询用户参与的所有会话
    const conversations = await prisma.conversations.findMany({
      where: {
        OR: [{ user1_id: userId }, { user2_id: userId }],
        is_deleted: false,
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            avatar: true,
            is_deleted: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            avatar: true,
            is_deleted: true,
          },
        },
        messages: {
          where: { is_deleted: false },
          orderBy: { created_at: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            is_read: true,
            created_at: true,
            sender_id: true,
          },
        },
      },
      orderBy: { updated_at: "desc" },
    })

    // 格式化会话列表
    const formattedConversations = conversations.map((conv) => {
      // 确定对方用户
      const otherUser = conv.user1_id === userId ? conv.user2 : conv.user1
      const lastMessage = conv.messages[0] || null

      return {
        id: String(conv.id),
        otherUser: {
          id: String(otherUser.id),
          name: otherUser.name,
          avatar: otherUser.avatar,
          isDeleted: otherUser.is_deleted,
        },
        lastMessage: lastMessage
          ? {
              id: String(lastMessage.id),
              content: lastMessage.content,
              isRead: lastMessage.is_read,
              isSentByMe: lastMessage.sender_id === userId,
              createdAt: lastMessage.created_at.toISOString(),
            }
          : null,
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
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { targetUserId } = body

    if (!targetUserId) {
      return NextResponse.json(
        { error: "targetUserId is required" },
        { status: 400 }
      )
    }

    const currentUserId = sessionUser.userId
    const targetUserIdBigInt = BigInt(targetUserId)

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

    // 检查是否已存在会话
    const existingConversation = await prisma.conversations.findFirst({
      where: {
        OR: [
          {
            user1_id: currentUserId,
            user2_id: targetUserIdBigInt,
          },
          {
            user1_id: targetUserIdBigInt,
            user2_id: currentUserId,
          },
        ],
        is_deleted: false,
      },
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

    // 创建新会话
    const newConversation = await prisma.conversations.create({
      data: {
        id: generateId(),
        user1_id: currentUserId,
        user2_id: targetUserIdBigInt,
      },
    })

    return NextResponse.json({
      conversation: {
        id: String(newConversation.id),
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
