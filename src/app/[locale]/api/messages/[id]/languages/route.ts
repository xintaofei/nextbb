import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  let messageId: bigint
  try {
    messageId = BigInt(id)
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const message = await prisma.messages.findUnique({
    where: { id: messageId },
    select: { source_locale: true },
  })

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 })
  }

  const translations = await prisma.message_translations.findMany({
    where: { message_id: messageId },
    select: { locale: true, is_source: true },
  })

  // Ensure source locale is in the list and normalized
  const languagesMap = new Map<string, { locale: string; isSource: boolean }>()

  // Add source language first
  languagesMap.set(message.source_locale, {
    locale: message.source_locale,
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
    sourceLocale: message.source_locale,
    languages,
  })
}
