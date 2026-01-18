import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const { searchParams } = new URL(req.url)
  const locale = searchParams.get("locale")

  if (!locale) {
    return NextResponse.json({ error: "Locale required" }, { status: 400 })
  }

  let postId: bigint
  try {
    postId = BigInt(id)
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  // Check if it's the source locale
  const post = await prisma.posts.findUnique({
    where: { id: postId },
    select: { source_locale: true, content: true },
  })

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  // If requesting source locale, try to find in translations first (for HTML format),
  // if not found (e.g. not yet processed), might need to return raw content or handle it.
  // But usually we want HTML.
  // Let's try to fetch translation record.

  const translation = await prisma.post_translations.findUnique({
    where: {
      post_id_locale: {
        post_id: postId,
        locale: locale,
      },
    },
    select: { content_html: true },
  })

  if (translation) {
    return NextResponse.json({ contentHtml: translation.content_html })
  }

  // If no translation record but it IS the source locale,
  // fall back to the raw content from the posts table.
  if (locale === post.source_locale) {
    return NextResponse.json({ contentHtml: null, content: post.content })
  }

  return NextResponse.json({ error: "Translation not found" }, { status: 404 })
}
