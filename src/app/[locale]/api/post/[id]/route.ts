import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getSessionUser } from "@/lib/auth"

const PostUpdateSchema = z.object({
  content: z.string().min(1),
  content_html: z.string(),
})

type PostUpdateDTO = z.infer<typeof PostUpdateSchema>

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await getSessionUser()
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: idStr } = await ctx.params
  let postId: bigint
  try {
    postId = BigInt(idStr)
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let body: PostUpdateDTO
  try {
    const json = await req.json()
    body = PostUpdateSchema.parse(json)
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const post = await prisma.posts.findUnique({
    where: { id: postId },
    select: { id: true, user_id: true, is_deleted: true, source_locale: true },
  })
  if (!post || post.is_deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (post.user_id !== auth.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const sourceLocale = post.source_locale || "zh"

  await prisma.posts.update({
    where: { id: postId },
    data: {
      content: body.content,
      translations: {
        upsert: {
          where: {
            post_id_locale: {
              post_id: postId,
              locale: sourceLocale,
            },
          },
          update: {
            content_html: body.content_html,
          },
          create: {
            locale: sourceLocale,
            content_html: body.content_html,
            is_source: true,
            version: 1,
          },
        },
      },
    },
    select: { id: true },
  })

  return NextResponse.json({ ok: true }, { status: 200 })
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await getSessionUser()
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: idStr } = await ctx.params
  let postId: bigint
  try {
    postId = BigInt(idStr)
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const post = await prisma.posts.findUnique({
    where: { id: postId },
    select: { id: true, user_id: true, is_deleted: true },
  })
  if (!post || post.is_deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (post.user_id !== auth.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.posts.update({
    where: { id: postId },
    data: { is_deleted: true },
    select: { id: true },
  })

  return NextResponse.json({ ok: true }, { status: 200 })
}
