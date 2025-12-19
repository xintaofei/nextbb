import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getSessionUser } from "@/lib/auth"
import { generateId } from "@/lib/id"

const ReplyCreateSchema = z.object({
  content: z.string().min(1),
  parentId: z.string().regex(/^\d+$/).optional(),
})

type ReplyCreateDTO = z.infer<typeof ReplyCreateSchema>

type ReplyCreateResult = {
  postId: string
  floorNumber: number
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await getSessionUser()
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: idStr } = await ctx.params
  let topicId: bigint
  try {
    topicId = BigInt(idStr)
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let body: ReplyCreateDTO
  try {
    const json = await req.json()
    body = ReplyCreateSchema.parse(json)
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const topic = await prisma.topics.findFirst({
    where: { id: topicId, is_deleted: false },
    select: { id: true },
  })
  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 })
  }

  const last = await prisma.posts.findFirst({
    where: { topic_id: topicId, is_deleted: false },
    select: { floor_number: true },
    orderBy: { floor_number: "desc" },
  })
  const nextFloor = (last?.floor_number ?? 0) + 1

  let parentId: bigint = BigInt(0)
  let replyToUserId: bigint = BigInt(0)
  if (body.parentId) {
    try {
      parentId = BigInt(body.parentId)
    } catch {
      return NextResponse.json({ error: "Invalid parentId" }, { status: 400 })
    }
    const parent = await prisma.posts.findFirst({
      where: { id: parentId, topic_id: topicId, is_deleted: false },
      select: { user_id: true },
    })
    if (!parent) {
      return NextResponse.json(
        { error: "Parent post not found" },
        { status: 404 }
      )
    }
    replyToUserId = parent.user_id
  }

  const created = await prisma.posts.create({
    data: {
      id: generateId(),
      topic_id: topicId,
      user_id: auth.userId,
      parent_id: parentId,
      reply_to_user_id: replyToUserId,
      floor_number: nextFloor,
      content: body.content,
      is_deleted: false,
    },
    select: { id: true, floor_number: true },
  })

  const response: ReplyCreateResult = {
    postId: String(created.id),
    floorNumber: created.floor_number,
  }
  return NextResponse.json(response, { status: 201 })
}
