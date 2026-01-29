import { NextResponse } from "next/server"
import { getServerSessionUser } from "@/lib/server-auth"
import { getLocale } from "next-intl/server"
import { getTopicInfo, incrementTopicViews } from "@/lib/topic-service"

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  await getServerSessionUser()
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
