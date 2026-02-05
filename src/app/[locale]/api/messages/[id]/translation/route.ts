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

  let messageId: bigint
  try {
    messageId = BigInt(id)
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  // Check if it's the source locale
  const message = await prisma.messages.findUnique({
    where: { id: messageId },
    select: { source_locale: true, content: true },
  })

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 })
  }

  // Try to fetch translation record
  const translation = await prisma.message_translations.findUnique({
    where: {
      message_id_locale: {
        message_id: messageId,
        locale: locale,
      },
    },
    select: { content_html: true },
  })

  if (translation) {
    return NextResponse.json({ contentHtml: translation.content_html })
  }

  // If no translation record but it IS the source locale,
  // fall back to the raw content from the messages table.
  if (locale === message.source_locale) {
    return NextResponse.json({ contentHtml: null, content: message.content })
  }

  return NextResponse.json({ error: "Translation not found" }, { status: 404 })
}
