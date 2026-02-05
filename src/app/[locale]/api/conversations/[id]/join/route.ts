import { NextResponse } from "next/server"
import { ConversationType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getServerSessionUser } from "@/lib/server-auth"

export async function POST(
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

  const conversation = await prisma.conversations.findFirst({
    where: { id: conversationId, is_deleted: false },
    select: { id: true, type: true },
  })

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (conversation.type !== ConversationType.GROUP) {
    return NextResponse.json(
      { error: "Only group conversations are supported" },
      { status: 400 }
    )
  }

  await prisma.$transaction([
    prisma.conversation_members.upsert({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: session.userId,
        },
      },
      create: {
        conversation_id: conversationId,
        user_id: session.userId,
      },
      update: {
        is_deleted: false,
        joined_at: new Date(),
      },
    }),
    prisma.conversations.update({
      where: { id: conversationId },
      data: { updated_at: new Date() },
    }),
  ])

  return NextResponse.json({ success: true })
}
