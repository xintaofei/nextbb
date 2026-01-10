import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import { generateId } from "@/lib/id"

type Params = Promise<{ id: string }>

/**
 * 获取会话的消息列表
 * GET /api/conversations/:id/messages
 */
export async function GET(req: Request, props: { params: Params }) {
  const params = await props.params
  const conversationId = BigInt(params.id)

  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = sessionUser.userId

    // 验证会话是否存在且用户有权限访问
    const conversation = await prisma.conversations.findFirst({
      where: {
        id: conversationId,
        OR: [{ user1_id: userId }, { user2_id: userId }],
        is_deleted: false,
      },
      include: {
        user1: {
          select: { id: true, name: true, avatar: true },
        },
        user2: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    // 获取消息列表
    const messages = await prisma.messages.findMany({
      where: {
        conversation_id: conversationId,
        is_deleted: false,
      },
      orderBy: { created_at: "asc" },
      select: {
        id: true,
        content: true,
        sender_id: true,
        is_read: true,
        created_at: true,
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    // 标记对方发送的消息为已读
    await prisma.messages.updateMany({
      where: {
        conversation_id: conversationId,
        sender_id: { not: userId },
        is_read: false,
        is_deleted: false,
      },
      data: {
        is_read: true,
      },
    })

    const formattedMessages = messages.map((msg) => ({
      id: String(msg.id),
      content: msg.content,
      sender: {
        id: String(msg.sender.id),
        name: msg.sender.name,
        avatar: msg.sender.avatar,
      },
      isSentByMe: msg.sender_id === userId,
      isRead: msg.is_read,
      createdAt: msg.created_at.toISOString(),
    }))

    // 确定对方用户
    const otherUser =
      conversation.user1_id === userId ? conversation.user2 : conversation.user1

    return NextResponse.json({
      messages: formattedMessages,
      otherUser: {
        id: String(otherUser.id),
        name: otherUser.name,
        avatar: otherUser.avatar,
      },
    })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}

/**
 * 发送消息
 * POST /api/conversations/:id/messages
 */
export async function POST(req: Request, props: { params: Params }) {
  const params = await props.params
  const conversationId = BigInt(params.id)

  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = sessionUser.userId
    const body = await req.json()
    const { content } = body

    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      )
    }

    // 验证会话是否存在且用户有权限
    const conversation = await prisma.conversations.findFirst({
      where: {
        id: conversationId,
        OR: [{ user1_id: userId }, { user2_id: userId }],
        is_deleted: false,
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    // 创建消息
    const message = await prisma.messages.create({
      data: {
        id: generateId(),
        conversation_id: conversationId,
        sender_id: userId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    // 更新会话的 updated_at 时间
    await prisma.conversations.update({
      where: { id: conversationId },
      data: { updated_at: new Date() },
    })

    return NextResponse.json({
      message: {
        id: String(message.id),
        content: message.content,
        sender: {
          id: String(message.sender.id),
          name: message.sender.name,
          avatar: message.sender.avatar,
        },
        isSentByMe: true,
        isRead: message.is_read,
        createdAt: message.created_at.toISOString(),
      },
    })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}
