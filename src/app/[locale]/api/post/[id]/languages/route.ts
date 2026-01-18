import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  let postId: bigint
  try {
    postId = BigInt(id)
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const post = await prisma.posts.findUnique({
    where: { id: postId },
    select: { source_locale: true },
  })

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  const translations = await prisma.post_translations.findMany({
    where: { post_id: postId },
    select: { locale: true, is_source: true },
  })

  // Ensure source locale is in the list and normalized
  const languagesMap = new Map<string, { locale: string; isSource: boolean }>()

  // Add source language first
  languagesMap.set(post.source_locale, {
    locale: post.source_locale,
    isSource: true,
  })

  // Add other languages from translations
  for (const t of translations) {
    if (t.is_source) continue
    languagesMap.set(t.locale, {
      locale: t.locale,
      isSource: false,
    })
  }

  const languages = Array.from(languagesMap.values())

  return NextResponse.json({
    sourceLocale: post.source_locale,
    languages,
  })
}
