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

  // Ensure source locale is in the list even if no translation record exists (though it should)
  const languages = translations.map((t) => ({
    locale: t.locale,
    isSource: t.is_source,
  }))

  const hasSourceInList = languages.some((l) => l.locale === post.source_locale)
  if (!hasSourceInList) {
    languages.push({
      locale: post.source_locale,
      isSource: true,
    })
  }

  return NextResponse.json({
    sourceLocale: post.source_locale,
    languages,
  })
}
