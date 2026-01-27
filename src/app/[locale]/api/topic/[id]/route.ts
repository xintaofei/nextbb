import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { getLocale } from "next-intl/server"
import { getTopicInfo, incrementTopicViews } from "@/lib/topic-service"

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  await getSessionUser()
  const locale = await getLocale()
  const { id: idStr } = await ctx.params

  let topicId: bigint
  try {
    topicId = BigInt(idStr)
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const topic = await getTopicInfo(topicId, locale)
  if (!topic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await incrementTopicViews(topicId)

  return NextResponse.json({ topic })
}
